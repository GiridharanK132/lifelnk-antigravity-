package com.lifelink.repository;

import com.lifelink.model.DonationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DonationHistoryRepository extends JpaRepository<DonationHistory, Integer> {
    List<DonationHistory> findByDonorId(Integer donorId);
    List<DonationHistory> findByHospitalId(Integer hospitalId);
}
