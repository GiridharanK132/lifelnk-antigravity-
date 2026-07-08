package com.lifelink.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifelink.agent.CoordinatorAgent;
import com.lifelink.dto.AgentRecommendationResponse;
import com.lifelink.dto.AgentRecommendationResponse.AllocationItem;
import com.lifelink.model.*;
import com.lifelink.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class RequestService {

    @Autowired
    private EmergencyRequestRepository requestRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private BloodTransactionRepository transactionRepository;

    @Autowired
    private BloodInventoryRepository inventoryRepository;

    @Autowired
    private EmergencyApprovalRepository approvalRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CoordinatorAgent coordinatorAgent;

    @Autowired
    private AIRecommendationRepository aiRecommendationRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<EmergencyRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    public List<EmergencyRequest> getRequestsByHospital(Integer hospitalId) {
        return requestRepository.findByRequestingHospitalId(hospitalId);
    }

    public EmergencyRequest getRequestById(Integer id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Emergency request not found with id: " + id));
    }

    @Transactional
    public AgentRecommendationResponse submitRequest(Integer requestingHospitalId, String bloodGroup, int unitsRequired, String priority) {
        Hospital requestingHospital = hospitalRepository.findById(requestingHospitalId)
                .orElseThrow(() -> new RuntimeException("Requesting Hospital not found"));

        EmergencyRequest request = new EmergencyRequest();
        request.setRequestingHospital(requestingHospital);
        request.setBloodGroup(bloodGroup.toUpperCase());
        request.setUnitsRequired(unitsRequired);
        request.setPriority(priority.toUpperCase());
        request.setStatus("PENDING");

        EmergencyRequest savedRequest = requestRepository.save(request);

        // Run multi-agent coordination workflow
        AgentRecommendationResponse aiReport = coordinatorAgent.coordinateEmergency(savedRequest);

        // Update request notes and status if fraud flagged
        if (Boolean.TRUE.equals(aiReport.getFraudFlagged())) {
            savedRequest.setStatus("REJECTED");
            savedRequest.setCoordinatorNotes("Fraud Detected: " + aiReport.getFraudReason());
            requestRepository.save(savedRequest);
            return aiReport;
        }

        // If allocation suggested source units, register PENDING transactions
        if (aiReport.getIsAllocated() && !aiReport.getAllocations().isEmpty()) {
            for (AllocationItem item : aiReport.getAllocations()) {
                Hospital sourceHospital = hospitalRepository.findById(item.getHospitalId())
                        .orElseThrow(() -> new RuntimeException("Source Hospital not found: " + item.getHospitalId()));

                BloodTransaction tx = new BloodTransaction();
                tx.setRequest(savedRequest);
                tx.setBloodGroup(bloodGroup.toUpperCase());
                tx.setUnits(item.getUnitsProvided());
                tx.setSourceHospital(sourceHospital);
                tx.setDestinationHospital(requestingHospital);
                tx.setStatus("PENDING");
                tx.setTransactionDate(LocalDateTime.now());
                transactionRepository.save(tx);
            }
            savedRequest.setStatus("ALLOCATED");
        } else {
            savedRequest.setStatus("PENDING"); // Awaiting local donors or manual coordination
        }

        requestRepository.save(savedRequest);
        return aiReport;
    }

    public List<BloodTransaction> getPendingTransactionsForHospital(Integer hospitalId) {
        return transactionRepository.findBySourceHospitalId(hospitalId).stream()
                .filter(t -> "PENDING".equals(t.getStatus()))
                .toList();
    }

    public List<BloodTransaction> getTransactionsForHospital(Integer hospitalId) {
        List<BloodTransaction> list = new ArrayList<>();
        list.addAll(transactionRepository.findBySourceHospitalId(hospitalId));
        list.addAll(transactionRepository.findByDestinationHospitalId(hospitalId));
        return list;
    }

    public List<BloodTransaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @Transactional
    public void approveTransaction(Integer transactionId, Integer adminUserId) {
        BloodTransaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!"PENDING".equals(tx.getStatus())) {
            throw new RuntimeException("Transaction is not pending");
        }

        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin User not found"));

        // Deduct units from inventory
        List<BloodInventory> inventoryList = inventoryRepository.findByHospitalIdAndBloodGroupAndStatus(
                tx.getSourceHospital().getId(), tx.getBloodGroup(), "AVAILABLE"
        );

        int remainingToDeduct = tx.getUnits();
        for (BloodInventory stock : inventoryList) {
            if (remainingToDeduct <= 0) break;
            
            int available = stock.getAvailableUnits();
            if (available >= remainingToDeduct) {
                stock.setAvailableUnits(available - remainingToDeduct);
                remainingToDeduct = 0;
            } else {
                stock.setAvailableUnits(0);
                stock.setStatus("RESERVED");
                remainingToDeduct -= available;
            }
            inventoryRepository.save(stock);
        }

        if (remainingToDeduct > 0) {
            throw new RuntimeException("Insufficient stock in inventory to fulfill approved units. Database state mismatch.");
        }

        tx.setStatus("COMPLETED");
        transactionRepository.save(tx);

        // Record approval
        EmergencyApproval approval = new EmergencyApproval();
        approval.setRequest(tx.getRequest());
        approval.setHospital(tx.getSourceHospital());
        approval.setApprovedUnits(tx.getUnits());
        approval.setApprovedBy(adminUser);
        approval.setStatus("APPROVED");
        approvalRepository.save(approval);

        // Check if all transactions for this request are completed
        checkRequestCompletion(tx.getRequest());
    }

    @Transactional
    public void rejectTransaction(Integer transactionId, Integer adminUserId) {
        BloodTransaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!"PENDING".equals(tx.getStatus())) {
            throw new RuntimeException("Transaction is not pending");
        }

        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin User not found"));

        tx.setStatus("CANCELLED");
        transactionRepository.save(tx);

        // Record rejection
        EmergencyApproval approval = new EmergencyApproval();
        approval.setRequest(tx.getRequest());
        approval.setHospital(tx.getSourceHospital());
        approval.setApprovedUnits(0);
        approval.setApprovedBy(adminUser);
        approval.setStatus("REJECTED");
        approvalRepository.save(approval);

        // Update emergency request status to REJECTED or PARTIAL
        EmergencyRequest req = tx.getRequest();
        req.setStatus("REJECTED");
        req.setCoordinatorNotes("Allocation rejected by " + tx.getSourceHospital().getName() + " Admin.");
        requestRepository.save(req);
    }

    private void checkRequestCompletion(EmergencyRequest request) {
        List<BloodTransaction> transactions = transactionRepository.findByRequestId(request.getId());
        boolean allDone = transactions.stream().allMatch(t -> "COMPLETED".equals(t.getStatus()));
        if (allDone) {
            request.setStatus("COMPLETED");
            requestRepository.save(request);
        }
    }

    public String getAIRecommendation(Integer requestId) {
        Optional<AIRecommendation> rec = aiRecommendationRepository.findByRequestId(requestId);
        return rec.map(AIRecommendation::getRecommendationJson).orElse(null);
    }
}
