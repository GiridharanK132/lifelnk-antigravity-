package com.lifelink.repository;

import com.lifelink.model.AIRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AIRecommendationRepository extends JpaRepository<AIRecommendation, Integer> {
    Optional<AIRecommendation> findByRequestId(Integer requestId);
}
