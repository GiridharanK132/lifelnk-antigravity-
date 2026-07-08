package com.lifelink.agent;

import com.lifelink.agent.PriorityDecisionAgent.CandidateHospitalScore;
import com.lifelink.dto.AgentRecommendationResponse.AllocationItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;

@Component
public class BloodAllocationAgent {
    private static final Logger logger = LoggerFactory.getLogger(BloodAllocationAgent.class);

    public AllocationPlan createAllocationPlan(List<CandidateHospitalScore> rankedHospitals, int unitsRequired) {
        logger.info("[BloodAllocationAgent] Crafting allocation plan for {} units across {} candidate hospitals", unitsRequired, rankedHospitals.size());
        
        List<AllocationItem> allocations = new ArrayList<>();
        int remainingUnitsNeeded = unitsRequired;
        
        for (CandidateHospitalScore candidate : rankedHospitals) {
            if (remainingUnitsNeeded <= 0) {
                break;
            }
            
            int available = candidate.getStockItem().getAvailableUnits();
            int unitsToTake = Math.min(available, remainingUnitsNeeded);
            
            if (unitsToTake > 0) {
                allocations.add(new AllocationItem(
                        candidate.getHospital().getId(),
                        candidate.getHospital().getName(),
                        unitsToTake,
                        candidate.getDistance()
                ));
                remainingUnitsNeeded -= unitsToTake;
                logger.info("[BloodAllocationAgent] Allocated {} units from hospital {}", unitsToTake, candidate.getHospital().getName());
            }
        }
        
        boolean fullyAllocated = (remainingUnitsNeeded == 0);
        return new AllocationPlan(allocations, fullyAllocated, unitsRequired - remainingUnitsNeeded);
    }

    public static class AllocationPlan {
        private final List<AllocationItem> allocations;
        private final boolean fullyAllocated;
        private final int allocatedUnits;

        public AllocationPlan(List<AllocationItem> allocations, boolean fullyAllocated, int allocatedUnits) {
            this.allocations = allocations;
            this.fullyAllocated = fullyAllocated;
            this.allocatedUnits = allocatedUnits;
        }

        public List<AllocationItem> getAllocations() { return allocations; }
        public boolean isFullyAllocated() { return fullyAllocated; }
        public int getAllocatedUnits() { return allocatedUnits; }
    }
}
