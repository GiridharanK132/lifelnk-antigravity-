package com.lifelink.agent;

import com.lifelink.model.BloodInventory;
import com.lifelink.model.Hospital;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;

@Component
public class PriorityDecisionAgent {
    private static final Logger logger = LoggerFactory.getLogger(PriorityDecisionAgent.class);

    @Autowired
    private DistanceOptimizationAgent distanceAgent;

    public List<CandidateHospitalScore> scoreHospitals(Hospital requestingHospital, List<BloodInventory> availableStock, String priority) {
        logger.info("[PriorityDecisionAgent] Scoring hospitals for request priority {}", priority);
        
        List<CandidateHospitalScore> scores = new ArrayList<>();
        
        for (BloodInventory stock : availableStock) {
            Hospital target = stock.getHospital();
            if (target.getId().equals(requestingHospital.getId())) {
                continue;
            }
            
            double distance = distanceAgent.calculateDistance(requestingHospital, target);
            
            double priorityWeight = 1.0;
            if ("CRITICAL".equalsIgnoreCase(priority)) {
                priorityWeight = 2.5;
            } else if ("HIGH".equalsIgnoreCase(priority)) {
                priorityWeight = 1.8;
            } else if ("MEDIUM".equalsIgnoreCase(priority)) {
                priorityWeight = 1.2;
            }
            
            double scoreValue = (stock.getAvailableUnits() * 3.0) - (distance * (3.0 / priorityWeight));
            
            scores.add(new CandidateHospitalScore(target, stock, distance, scoreValue));
        }
        
        scores.sort((h1, h2) -> Double.compare(h2.getScore(), h1.getScore()));
        return scores;
    }

    public static class CandidateHospitalScore {
        private final Hospital hospital;
        private final BloodInventory stockItem;
        private final double distance;
        private final double score;

        public CandidateHospitalScore(Hospital hospital, BloodInventory stockItem, double distance, double score) {
            this.hospital = hospital;
            this.stockItem = stockItem;
            this.distance = distance;
            this.score = score;
        }

        public Hospital getHospital() { return hospital; }
        public BloodInventory getStockItem() { return stockItem; }
        public double getDistance() { return distance; }
        public double getScore() { return score; }
    }
}
