package com.lifelink.repository;

import com.lifelink.model.HospitalAdmin;
import com.lifelink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface HospitalAdminRepository extends JpaRepository<HospitalAdmin, Integer> {
    Optional<HospitalAdmin> findByUser(User user);
    Optional<HospitalAdmin> findByUserId(Integer userId);
}
