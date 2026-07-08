package com.lifelink.agent;

import com.lifelink.model.BloodInventory;
import com.lifelink.repository.BloodInventoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class BloodInventoryAgent {
    private static final Logger logger = LoggerFactory.getLogger(BloodInventoryAgent.class);

    @Autowired
    private BloodInventoryRepository inventoryRepository;

    public List<BloodInventory> searchStock(String bloodGroup) {
        logger.info("[BloodInventoryAgent] Searching stock for group: {}", bloodGroup);
        return inventoryRepository.findByBloodGroupAndStatus(bloodGroup, "AVAILABLE");
    }
}
