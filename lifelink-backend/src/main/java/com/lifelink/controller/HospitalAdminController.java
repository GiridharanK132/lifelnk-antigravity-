package com.lifelink.controller;

import com.lifelink.model.*;
import com.lifelink.repository.HospitalAdminRepository;
import com.lifelink.security.UserPrincipal;
import com.lifelink.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyAuthority('ROLE_HOSPITAL_ADMIN', 'ROLE_SUPER_ADMIN')")
public class HospitalAdminController {

    @Autowired
    private HospitalAdminRepository adminRepository;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private RequestService requestService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private HospitalService hospitalService;

    private Integer getAdminHospitalId(UserPrincipal principal) {
        HospitalAdmin adminMapping = adminRepository.findByUserId(principal.getUser().getId())
                .orElseThrow(() -> new RuntimeException("Hospital Admin mapping not found for user: " + principal.getUser().getName()));
        return adminMapping.getHospital().getId();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        Integer hospitalId = getAdminHospitalId(principal);
        Hospital hospital = hospitalService.getHospitalById(hospitalId);
        List<BloodInventory> inventory = inventoryService.getInventoryByHospital(hospitalId);
        List<BloodTransaction> pendingTxs = requestService.getPendingTransactionsForHospital(hospitalId);
        List<Notification> notifications = notificationService.getNotificationsForUser(principal.getUser().getId());

        Map<String, Object> data = new HashMap<>();
        data.put("hospital", hospital);
        data.put("inventory", inventory);
        data.put("pendingTransactions", pendingTxs);
        data.put("notifications", notifications);

        return ResponseEntity.ok(data);
    }

    @PostMapping("/inventory")
    public ResponseEntity<?> addInventory(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody BloodInventory request) {
        try {
            Integer hospitalId = getAdminHospitalId(principal);
            BloodInventory item = inventoryService.addOrUpdateInventory(
                    hospitalId,
                    request.getBloodGroup(),
                    request.getAvailableUnits(),
                    request.getCollectionDate(),
                    request.getExpiryDate(),
                    principal.getUser().getId()
            );
            return ResponseEntity.ok(item);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/inventory/{id}")
    public ResponseEntity<?> updateInventoryUnits(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id,
            @RequestParam int units) {
        try {
            BloodInventory updated = inventoryService.updateStockUnits(id, units, principal.getUser().getId());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/inventory/cleanup")
    public ResponseEntity<?> cleanupExpired(@AuthenticationPrincipal UserPrincipal principal) {
        inventoryService.scanAndHandleExpiredUnits();
        return ResponseEntity.ok("Expired units scanned and cleaned up.");
    }

    @PostMapping("/transactions/{id}/approve")
    public ResponseEntity<?> approveTransaction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id) {
        try {
            requestService.approveTransaction(id, principal.getUser().getId());
            return ResponseEntity.ok("Transaction approved and stock allocated.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/transactions/{id}/reject")
    public ResponseEntity<?> rejectTransaction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id) {
        try {
            requestService.rejectTransaction(id, principal.getUser().getId());
            return ResponseEntity.ok("Transaction rejected.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/requests/{id}/recommendation")
    public ResponseEntity<?> getRecommendation(@PathVariable Integer id) {
        String json = requestService.getAIRecommendation(id);
        if (json != null) {
            return ResponseEntity.ok(json);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(principal.getUser().getId()));
    }

    @PostMapping("/notifications/read-all")
    public ResponseEntity<?> readAllNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getUser().getId());
        return ResponseEntity.ok("All notifications marked as read.");
    }

    @PutMapping("/hospital")
    public ResponseEntity<?> updateHospitalProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Hospital details) {
        try {
            Integer hospitalId = getAdminHospitalId(principal);
            Hospital updated = hospitalService.updateHospital(hospitalId, details);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
