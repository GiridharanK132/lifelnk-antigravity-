package com.lifelink.repository;

import com.lifelink.model.EmergencyRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmergencyRequestRepository extends JpaRepository<EmergencyRequest, Integer> {
    List<EmergencyRequest> findByRequestingHospitalId(Integer hospitalId);
}
