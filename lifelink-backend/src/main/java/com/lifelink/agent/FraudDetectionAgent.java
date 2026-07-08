package com.lifelink.agent;

import com.lifelink.model.EmergencyRequest;
import com.lifelink.repository.EmergencyRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class FraudDetectionAgent {
    private static final Logger logger = LoggerFactory.getLogger(FraudDetectionAgent.class);

    @Autowired
    private EmergencyRequestRepository requestRepository;

    public FraudResult checkFraud(EmergencyRequest currentRequest) {
        logger.info("[FraudDetectionAgent] Running duplication and anomaly scan for hospital id {}", currentRequest.getRequestingHospital().getId());
        
        List<EmergencyRequest> recentRequests = requestRepository.findByRequestingHospitalId(currentRequest.getRequestingHospital().getId());
        LocalDateTime fifteenMinutesAgo = LocalDateTime.now().minusMinutes(15);
        
        for (EmergencyRequest request : recentRequests) {
            if (currentRequest.getId() != null && currentRequest.getId().equals(request.getId())) {
                continue;
            }
            if (request.getBloodGroup().equalsIgnoreCase(currentRequest.getBloodGroup())
                    && request.getUnitsRequired().equals(currentRequest.getUnitsRequired())
                    && request.getCreatedAt().isAfter(fifteenMinutesAgo)
                    && !"REJECTED".equalsIgnoreCase(request.getStatus())) {
                logger.warn("[FraudDetectionAgent] Potential duplicate request flagged! Request ID {} matches current request.", request.getId());
                return new FraudResult(true, "Duplicate request flagged. An identical request for " 
                    + currentRequest.getUnitsRequired() + " units of " + currentRequest.getBloodGroup() 
                    + " was submitted by this hospital within the last 15 minutes (Request ID: " + request.getId() + ").");
            }
        }
        
        if (currentRequest.getUnitsRequired() > 100) {
            logger.warn("[FraudDetectionAgent] Unusually large quantity request flagged!");
            return new FraudResult(true, "Suspicious quantity requested (" + currentRequest.getUnitsRequired() + " units). Safety threshold exceeded.");
        }
        
        return new FraudResult(false, null);
    }

    public static class FraudResult {
        private final boolean flagged;
        private final String reason;

        public FraudResult(boolean flagged, String reason) {
            this.flagged = flagged;
            this.reason = reason;
        }

        public boolean isFlagged() { return flagged; }
        public String getReason() { return reason; }
    }
}
