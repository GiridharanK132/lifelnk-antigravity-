package com.lifelink.repository;

import com.lifelink.model.EmergencyApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmergencyApprovalRepository extends JpaRepository<EmergencyApproval, Integer> {
    List<EmergencyApproval> findByRequestId(Integer requestId);
    List<EmergencyApproval> findByHospitalId(Integer hospitalId);
}
