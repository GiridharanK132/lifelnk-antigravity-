package com.lifelink.agent;

import com.lifelink.model.BloodInventory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Component
public class BloodExpiryAgent {
    private static final Logger logger = LoggerFactory.getLogger(BloodExpiryAgent.class);

    public List<String> checkExpirations(List<BloodInventory> affectedStock) {
        logger.info("[BloodExpiryAgent] Scanning stock for nearing expiration units");
        List<String> alerts = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (BloodInventory stock : affectedStock) {
            long daysToExpiry = ChronoUnit.DAYS.between(today, stock.getExpiryDate());
            if (daysToExpiry <= 7 && daysToExpiry >= 0) {
                String msg = String.format("Stock item ID %d (Group: %s) at '%s' is nearing expiry in %d days (Expiry: %s).",
                        stock.getId(), stock.getBloodGroup(), stock.getHospital().getName(), daysToExpiry, stock.getExpiryDate());
                alerts.add(msg);
                logger.warn("[BloodExpiryAgent] {}", msg);
            }
        }
        return alerts;
    }
}
