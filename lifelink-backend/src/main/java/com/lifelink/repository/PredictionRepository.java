package com.lifelink.repository;

import com.lifelink.model.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PredictionRepository extends JpaRepository<Prediction, Integer> {
    List<Prediction> findByHospitalId(Integer hospitalId);
}
