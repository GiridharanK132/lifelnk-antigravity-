package com.lifelink.agent;

import com.lifelink.model.Donor;
import com.lifelink.model.Hospital;
import com.lifelink.repository.DonorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;

@Component
public class DonorRecommendationAgent {
    private static final Logger logger = LoggerFactory.getLogger(DonorRecommendationAgent.class);

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private DistanceOptimizationAgent distanceAgent;

    public List<CompatibleDonorResult> findCompatibleDonors(Hospital requestingHospital, String requestedBloodGroup) {
        logger.info("[DonorRecommendationAgent] Finding compatible donors for hospital {} and blood group {}", requestingHospital.getName(), requestedBloodGroup);
        
        List<Donor> allDonors = donorRepository.findAll();
        List<CompatibleDonorResult> results = new ArrayList<>();

        for (Donor donor : allDonors) {
            if (Boolean.TRUE.equals(donor.getIsAvailable()) && isCompatible(donor.getBloodGroup(), requestedBloodGroup)) {
                double dist = distanceAgent.calculateDistance(requestingHospital, donor);
                results.add(new CompatibleDonorResult(donor, dist));
            }
        }

        results.sort((d1, d2) -> Double.compare(d1.getDistance(), d2.getDistance()));
        return results;
    }

    public static boolean isCompatible(String donorGroup, String recipientGroup) {
        if (donorGroup == null || recipientGroup == null) return false;
        String dg = donorGroup.trim().toUpperCase();
        String rg = recipientGroup.trim().toUpperCase();
        if (dg.equals(rg)) return true;
        if ("O-".equals(dg)) return true;
        if ("O+".equals(dg)) {
            return rg.endsWith("+");
        }
        if ("A-".equals(dg)) {
            return rg.startsWith("A") || rg.startsWith("AB");
        }
        if ("A+".equals(dg)) {
            return "A+".equals(rg) || "AB+".equals(rg);
        }
        if ("B-".equals(dg)) {
            return rg.startsWith("B") || rg.startsWith("AB");
        }
        if ("B+".equals(dg)) {
            return "B+".equals(rg) || "AB+".equals(rg);
        }
        if ("AB-".equals(dg)) {
            return "AB-".equals(rg) || "AB+".equals(rg);
        }
        return false;
    }

    public static class CompatibleDonorResult {
        private final Donor donor;
        private final double distance;

        public CompatibleDonorResult(Donor donor, double distance) {
            this.donor = donor;
            this.distance = distance;
        }

        public Donor getDonor() { return donor; }
        public double getDistance() { return distance; }
    }
}
