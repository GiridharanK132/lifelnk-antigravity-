package com.lifelink.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifelink.agent.DonorRecommendationAgent.CompatibleDonorResult;
import com.lifelink.agent.FraudDetectionAgent.FraudResult;
import com.lifelink.agent.PriorityDecisionAgent.CandidateHospitalScore;
import com.lifelink.agent.BloodAllocationAgent.AllocationPlan;
import com.lifelink.dto.AgentRecommendationResponse;
import com.lifelink.dto.AgentRecommendationResponse.*;
import com.lifelink.model.*;
import com.lifelink.repository.AIRecommendationRepository;
import com.lifelink.repository.HospitalRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class CoordinatorAgent {
    private static final Logger logger = LoggerFactory.getLogger(CoordinatorAgent.class);

    @Autowired(required = false)
    private ChatLanguageModel chatModel;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private FraudDetectionAgent fraudAgent;

    @Autowired
    private BloodInventoryAgent inventoryAgent;

    @Autowired
    private AvailabilityVerificationAgent availabilityAgent;

    @Autowired
    private PriorityDecisionAgent priorityAgent;

    @Autowired
    private BloodAllocationAgent allocationAgent;

    @Autowired
    private DonorRecommendationAgent donorAgent;

    @Autowired
    private PredictionAgent predictionAgent;

    @Autowired
    private BloodExpiryAgent expiryAgent;

    @Autowired
    private NotificationAgent notificationAgent;

    @Autowired
    private AIRecommendationRepository aiRecommendationRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public AgentRecommendationResponse coordinateEmergency(EmergencyRequest request) {
        logger.info("[CoordinatorAgent] Coordinating emergency request ID {}", request.getId());
        List<AgentLogItem> logs = new ArrayList<>();
        logs.add(new AgentLogItem("CoordinatorAgent", "Initiate Request", "Started coordination for request ID " + request.getId()));

        // 1. Fraud Check
        FraudResult fraud = fraudAgent.checkFraud(request);
        logs.add(new AgentLogItem("FraudDetectionAgent", "Duplication & Integrity Scan", 
                fraud.isFlagged() ? "FLAGGED: " + fraud.getReason() : "PASSED: No duplication or anomaly detected"));

        if (fraud.isFlagged()) {
            AgentRecommendationResponse response = new AgentRecommendationResponse(
                    request.getId(), request.getBloodGroup(), request.getUnitsRequired(), request.getPriority(),
                    false, new ArrayList<>(), new ArrayList<>(), true, fraud.getReason(), new ArrayList<>(), logs
            );
            saveRecommendation(request, response);
            return response;
        }

        // 2. Inventory Retrieval
        List<BloodInventory> rawStock = inventoryAgent.searchStock(request.getBloodGroup());
        logs.add(new AgentLogItem("BloodInventoryAgent", "Stock Search", "Found " + rawStock.size() + " blood units matching group: " + request.getBloodGroup()));

        // 3. Availability and Expiry Verification
        List<BloodInventory> activeStock = availabilityAgent.verifyAvailability(rawStock);
        logs.add(new AgentLogItem("AvailabilityVerificationAgent", "Validation Scan", "Verified " + activeStock.size() + " unexpired and available stock entries."));

        // 4. Scoring and Distance Optimization
        List<CandidateHospitalScore> scores = priorityAgent.scoreHospitals(request.getRequestingHospital(), activeStock, request.getPriority());
        logs.add(new AgentLogItem("PriorityDecisionAgent", "Rank and Distance optimization", "Ranked " + scores.size() + " hospitals based on stock availability and coordinates."));

        // 5. Allocation planning (Splits if needed)
        AllocationPlan allocationPlan = allocationAgent.createAllocationPlan(scores, request.getUnitsRequired());
        logs.add(new AgentLogItem("BloodAllocationAgent", "Allocation Plan Splitter", 
                allocationPlan.isFullyAllocated() ? "SUCCESS: Fully allocated " + request.getUnitsRequired() + " units." 
                        : "PARTIAL: Allocated " + allocationPlan.getAllocatedUnits() + "/" + request.getUnitsRequired() + " units."));

        // 6. Donor recommendation if not fully satisfied
        List<DonorItem> recommendedDonors = new ArrayList<>();
        if (!allocationPlan.isFullyAllocated()) {
            List<CompatibleDonorResult> compatibleDonors = donorAgent.findCompatibleDonors(request.getRequestingHospital(), request.getBloodGroup());
            for (CompatibleDonorResult cdr : compatibleDonors) {
                recommendedDonors.add(new DonorItem(
                        cdr.getDonor().getUser().getName(),
                        cdr.getDonor().getBloodGroup(),
                        cdr.getDistance(),
                        cdr.getDonor().getContactNumber()
                ));
            }
            logs.add(new AgentLogItem("DonorRecommendationAgent", "Donor Matching Engine", "Located " + recommendedDonors.size() + " compatible registered local donors."));
        } else {
            logs.add(new AgentLogItem("DonorRecommendationAgent", "Donor Matching Engine", "Skipped (Full stock allocation achieved)"));
        }

        // 7. Prediction & Expiry scanning for affected stock
        List<BloodInventory> affectedStockList = new ArrayList<>();
        for (AllocationItem item : allocationPlan.getAllocations()) {
            activeStock.stream()
                .filter(s -> s.getHospital().getId().equals(item.getHospitalId()))
                .findFirst()
                .ifPresent(stock -> {
                    int orig = stock.getAvailableUnits();
                    stock.setAvailableUnits(orig - item.getUnitsProvided());
                    affectedStockList.add(stock);
                });
        }
        
        List<String> shortages = predictionAgent.checkShortages(affectedStockList, allocationPlan.getAllocatedUnits());
        logs.add(new AgentLogItem("PredictionAgent", "Shortage Forecasting", shortages.isEmpty() ? "No future stockout flags raised." : "Raised " + shortages.size() + " stock shortage warning alerts."));

        List<String> expAlerts = expiryAgent.checkExpirations(affectedStockList);
        logs.add(new AgentLogItem("BloodExpiryAgent", "Expiry Alert Engine", expAlerts.isEmpty() ? "No nearing-expiry warnings generated." : "Detected " + expAlerts.size() + " units nearing expiration."));

        // Restore original units
        for (int i = 0; i < allocationPlan.getAllocations().size(); i++) {
            AllocationItem item = allocationPlan.getAllocations().get(i);
            BloodInventory stock = affectedStockList.get(i);
            stock.setAvailableUnits(stock.getAvailableUnits() + item.getUnitsProvided());
        }

        List<String> combinedWarnings = new ArrayList<>();
        combinedWarnings.addAll(shortages);
        combinedWarnings.addAll(expAlerts);

        // 8. If LLM is active, refine the coordinator notes using Gemini!
        String finalNotes = "";
        if (chatModel != null) {
            try {
                logs.add(new AgentLogItem("CoordinatorAgent", "Google Gemini Reasoning", "Routing agent outputs to Gemini for medical coordination summarization."));
                String prompt = buildGeminiPrompt(request, allocationPlan, recommendedDonors, combinedWarnings);
                finalNotes = chatModel.generate(prompt);
            } catch (Exception e) {
                logger.error("Failed to run Gemini reasoning", e);
                finalNotes = buildDefaultHeuristicNotes(request, allocationPlan, recommendedDonors, combinedWarnings);
            }
        } else {
            logs.add(new AgentLogItem("CoordinatorAgent", "Heuristic reasoning Engine", "Gemini is offline. Using default deterministic medical coordination logic."));
            finalNotes = buildDefaultHeuristicNotes(request, allocationPlan, recommendedDonors, combinedWarnings);
        }

        AgentRecommendationResponse response = new AgentRecommendationResponse(
                request.getId(), request.getBloodGroup(), request.getUnitsRequired(), request.getPriority(),
                allocationPlan.isFullyAllocated(), allocationPlan.getAllocations(), recommendedDonors,
                false, null, combinedWarnings, logs
        );

        request.setCoordinatorNotes(finalNotes);
        saveRecommendation(request, response);

        // 9. Dispatch alerts
        List<Integer> sourceHospitalIds = allocationPlan.getAllocations().stream()
                .map(AllocationItem::getHospitalId)
                .toList();
        notificationAgent.dispatchEmergencyNotifications(
                request.getRequestingHospital().getId(), request.getBloodGroup(),
                request.getUnitsRequired(), request.getPriority(), sourceHospitalIds
        );
        logs.add(new AgentLogItem("NotificationAgent", "Alert Broadcast Dispatcher", "System and email notifications queued to source hospital admins and super admins."));

        return response;
    }

    private void saveRecommendation(EmergencyRequest request, AgentRecommendationResponse response) {
        try {
            AIRecommendation rec = new AIRecommendation();
            rec.setRequest(request);
            rec.setRecommendationJson(objectMapper.writeValueAsString(response));
            aiRecommendationRepository.save(rec);
        } catch (Exception e) {
            logger.error("Failed to save AI Recommendation to database", e);
        }
    }

    private String buildGeminiPrompt(EmergencyRequest request, AllocationPlan allocation, List<DonorItem> donors, List<String> warnings) {
        return "You are the Coordinator Agent for LifeLink AI. Synthesize a concise, professional coordination log for an emergency blood request.\n"
                + "Emergency Request details:\n"
                + "- Requesting Hospital: " + request.getRequestingHospital().getName() + "\n"
                + "- Requested Blood Group: " + request.getBloodGroup() + "\n"
                + "- Required Units: " + request.getUnitsRequired() + "\n"
                + "- Priority: " + request.getPriority() + "\n\n"
                + "AI Agent Allocations:\n"
                + allocation.getAllocations().stream().map(a -> "- Allocate " + a.getUnitsProvided() + " units from '" + a.getHospitalName() + "' (Distance: " + String.format("%.2f", a.getDistance()) + " km)").reduce("", (s1, s2) -> s1 + "\n" + s2) + "\n\n"
                + "Compatible Registered Donors:\n"
                + donors.stream().map(d -> "- Donor " + d.getDonorName() + " (Blood Group: " + d.getBloodGroup() + ", Distance: " + String.format("%.2f", d.getDistance()) + " km)").reduce("", (s1, s2) -> s1 + "\n" + s2) + "\n\n"
                + "Shortage/Expiry Warnings:\n"
                + String.join("\n", warnings) + "\n\n"
                + "Write a short summary (3-4 sentences max) explaining: \n"
                + "1) If the allocation was successful or requires compatible donors.\n"
                + "2) Highlights of the distance optimization.\n"
                + "3) Any critical shortage/expiry concerns. Keep a medical, urgent tone.";
    }

    private String buildDefaultHeuristicNotes(EmergencyRequest request, AllocationPlan allocation, List<DonorItem> donors, List<String> warnings) {
        StringBuilder sb = new StringBuilder();
        sb.append("LifeLink AI Coordinator: ");
        if (allocation.isFullyAllocated()) {
            sb.append("Successfully allocated ").append(request.getUnitsRequired()).append(" units of ").append(request.getBloodGroup()).append(". ");
        } else {
            sb.append("Could only allocate ").append(allocation.getAllocatedUnits()).append("/").append(request.getUnitsRequired()).append(" units. ");
            if (!donors.isEmpty()) {
                sb.append("Identified ").append(donors.size()).append(" compatible emergency donors nearby. ");
            }
        }
        sb.append(allocation.getAllocations().size()).append(" neighboring hospitals involved. ");
        if (!warnings.isEmpty()) {
            sb.append("Warning: ").append(warnings.size()).append(" potential inventory alert(s) triggered.");
        }
        return sb.toString();
    }
}
