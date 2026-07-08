package com.lifelink.agent;

import com.lifelink.model.BloodInventory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class AvailabilityVerificationAgent {
    private static final Logger logger = LoggerFactory.getLogger(AvailabilityVerificationAgent.class);

    public List<BloodInventory> verifyAvailability(List<BloodInventory> inventoryList) {
        logger.info("[AvailabilityVerificationAgent] Verifying availability and expiration for {} inventory items", inventoryList.size());
        LocalDate today = LocalDate.now();
        return inventoryList.stream()
                .filter(item -> {
                    boolean isNotExpired = item.getExpiryDate().isAfter(today) || item.getExpiryDate().isEqual(today);
                    boolean isAvailable = "AVAILABLE".equalsIgnoreCase(item.getStatus());
                    boolean hasUnits = item.getAvailableUnits() > 0;
                    return isNotExpired && isAvailable && hasUnits;
                })
                .collect(Collectors.toList());
    }
}
