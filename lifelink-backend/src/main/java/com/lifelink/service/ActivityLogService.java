package com.lifelink.service;

import com.lifelink.model.ActivityLog;
import com.lifelink.model.User;
import com.lifelink.repository.ActivityLogRepository;
import com.lifelink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ActivityLogService {

    @Autowired
    private ActivityLogRepository logRepository;

    @Autowired
    private UserRepository userRepository;

    public List<ActivityLog> getAllActivityLogs() {
        return logRepository.findAll();
    }

    public List<ActivityLog> getLogsByUser(Integer userId) {
        return logRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    @Transactional
    public void logActivity(Integer userId, String action, String details) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            ActivityLog log = new ActivityLog();
            log.setUser(user);
            log.setAction(action);
            log.setDetails(details);
            logRepository.save(log);
        }
    }
}
