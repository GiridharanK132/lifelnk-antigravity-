package com.lifelink.agent;

import com.lifelink.model.Hospital;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class DistanceOptimizationAgent {
    private static final Logger logger = LoggerFactory.getLogger(DistanceOptimizationAgent.class);

    public double calculateDistance(Hospital origin, Hospital target) {
        double lat1 = origin.getLatitude();
        double lon1 = origin.getLongitude();
        double lat2 = target.getLatitude();
        double lon2 = target.getLongitude();

        final int R = 6371; // Radius of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c;
        logger.debug("[DistanceOptimizationAgent] Distance between {} and {} is {} km", origin.getName(), target.getName(), distance);
        return distance;
    }

    public double calculateDistance(Hospital origin, com.lifelink.model.Donor donor) {
        if (donor.getLatitude() == null || donor.getLongitude() == null) {
            return 999.9; // Unknown distance
        }
        double lat1 = origin.getLatitude();
        double lon1 = origin.getLongitude();
        double lat2 = donor.getLatitude();
        double lon2 = donor.getLongitude();

        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
