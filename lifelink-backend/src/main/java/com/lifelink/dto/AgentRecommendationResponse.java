package com.lifelink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentRecommendationResponse {
    private Integer requestId;
    private String bloodGroup;
    private Integer unitsRequired;
    private String priority;
    private Boolean isAllocated;
    private List<AllocationItem> allocations;
    private List<DonorItem> compatibleDonors;
    private Boolean fraudFlagged;
    private String fraudReason;
    private List<String> shortageWarnings;
    private List<AgentLogItem> agentLogs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllocationItem {
        private Integer hospitalId;
        private String hospitalName;
        private Integer unitsProvided;
        private Double distance; // in km
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DonorItem {
        private String donorName;
        private String bloodGroup;
        private Double distance;
        private String contact;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentLogItem {
        private String agentName;
        private String action;
        private String decision;
    }
}
