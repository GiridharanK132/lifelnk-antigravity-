package com.lifelink.agent;

import com.lifelink.model.HospitalAdmin;
import com.lifelink.model.Notification;
import com.lifelink.model.User;
import com.lifelink.repository.HospitalAdminRepository;
import com.lifelink.repository.NotificationRepository;
import com.lifelink.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class NotificationAgent {
    private static final Logger logger = LoggerFactory.getLogger(NotificationAgent.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private HospitalAdminRepository adminRepository;

    @Autowired
    private UserRepository userRepository;

    public void dispatchEmergencyNotifications(Integer requestingHospitalId, String bloodGroup, int unitsRequired, String priority, List<Integer> sourceHospitalIds) {
        logger.info("[NotificationAgent] Dispatching alerts to source hospital admins");
        
        for (Integer hospitalId : sourceHospitalIds) {
            List<HospitalAdmin> admins = adminRepository.findAll().stream()
                    .filter(a -> a.getHospital().getId().equals(hospitalId))
                    .toList();
            
            for (HospitalAdmin admin : admins) {
                Notification notif = new Notification();
                notif.setUser(admin.getUser());
                notif.setTitle("CRITICAL: Emergency Blood Request Allocation");
                notif.setMessage(String.format("Emergency request for %d units of %s. AI coordinator allocated units from your hospital inventory. Please approve/reject.",
                        unitsRequired, bloodGroup));
                notif.setType("CRITICAL_REQUEST");
                notificationRepository.save(notif);
            }
        }

        List<User> superAdmins = userRepository.findAll().stream()
                .filter(u -> "ROLE_SUPER_ADMIN".equalsIgnoreCase(u.getRole().getName()))
                .toList();

        for (User sa : superAdmins) {
            Notification notif = new Notification();
            notif.setUser(sa);
            notif.setTitle("SYSTEM: Emergency Request Coordinator Initiated");
            notif.setMessage(String.format("Emergency blood coordination initiated: %d units of %s requested. Priority: %s.",
                    unitsRequired, bloodGroup, priority));
            notif.setType("SYSTEM");
            notificationRepository.save(notif);
        }
    }
}
