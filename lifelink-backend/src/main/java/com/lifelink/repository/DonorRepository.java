package com.lifelink.repository;

import com.lifelink.model.Donor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DonorRepository extends JpaRepository<Donor, Integer> {
    Optional<Donor> findByUserId(Integer userId);
    List<Donor> findByBloodGroupAndIsAvailableTrue(String bloodGroup);
}
