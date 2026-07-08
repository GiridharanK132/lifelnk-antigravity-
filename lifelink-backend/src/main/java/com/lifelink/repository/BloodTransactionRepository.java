package com.lifelink.repository;

import com.lifelink.model.BloodTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BloodTransactionRepository extends JpaRepository<BloodTransaction, Integer> {
    List<BloodTransaction> findByRequestId(Integer requestId);
    List<BloodTransaction> findBySourceHospitalId(Integer hospitalId);
    List<BloodTransaction> findByDestinationHospitalId(Integer hospitalId);
}
