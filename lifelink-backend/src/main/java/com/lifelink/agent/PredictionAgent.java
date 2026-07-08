package com.lifelink.agent;

import com.lifelink.model.BloodInventory;
import com.lifelink.model.Prediction;
import com.lifelink.repository.PredictionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class PredictionAgent {
    private static final Logger logger = LoggerFactory.getLogger(PredictionAgent.class);

    @Autowired
    private PredictionRepository predictionRepository;

    public List<String> checkShortages(List<BloodInventory> affectedStock, int unitsAllocated) {
        logger.info("[PredictionAgent] Checking future shortage impact for affected inventory items");
        List<String> warnings = new ArrayList<>();
        
        for (BloodInventory stock : affectedStock) {
            int remaining = stock.getAvailableUnits();
            if (remaining <= 3) {
                String msg = String.format("Hospital '%s' will face critical shortage of '%s' blood group. Remaining stock: %d units.",
                        stock.getHospital().getName(), stock.getBloodGroup(), remaining);
                warnings.add(msg);
                logger.warn("[PredictionAgent] {}", msg);
                
                try {
                    Prediction pred = new Prediction();
                    pred.setHospital(stock.getHospital());
                    pred.setBloodGroup(stock.getBloodGroup());
                    pred.setPredictedShortageDate(LocalDate.now().plusDays(3));
                    pred.setConfidenceScore(0.85);
                    pred.setRecommendedAction("Organize emergency blood drive for group " + stock.getBloodGroup() + " immediately.");
                    predictionRepository.save(pred);
                } catch (Exception e) {
                    logger.error("Failed to save prediction record", e);
                }
            }
        }
        return warnings;
    }
}
