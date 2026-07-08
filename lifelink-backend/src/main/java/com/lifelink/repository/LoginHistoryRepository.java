package com.lifelink.repository;

import com.lifelink.model.LoginHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Integer> {
    List<LoginHistory> findByUserIdOrderByLoginTimeDesc(Integer userId);
}
