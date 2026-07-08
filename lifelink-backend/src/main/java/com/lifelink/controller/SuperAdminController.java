package com.lifelink.controller;

import com.lifelink.model.*;
import com.lifelink.repository.UserRepository;
import com.lifelink.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/super")
@PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
public class SuperAdminController {

    @Autowired
    private HospitalService hospitalService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private RequestService requestService;

    @Autowired
    private PredictionService predictionService;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        List<Hospital> hospitals = hospitalService.getAllHospitals();
        List<BloodInventory> inventory = inventoryService.getAllInventory();
        List<EmergencyRequest> requests = requestService.getAllRequests();
        List<Prediction> predictions = predictionService.getAllPredictions();

        int totalUnits = inventory.stream()
                .filter(s -> "AVAILABLE".equals(s.getStatus()))
                .mapToInt(BloodInventory::getAvailableUnits)
                .sum();

        long activeRequests = requests.stream()
                .filter(r -> "PENDING".equals(r.getStatus()) || "ALLOCATED".equals(r.getStatus()))
                .count();

        Map<String, Object> data = new HashMap<>();
        data.put("totalHospitals", hospitals.size());
        data.put("totalBloodUnits", totalUnits);
        data.put("activeRequests", activeRequests);
        data.put("predictionsCount", predictions.size());
        
        return ResponseEntity.ok(data);
    }

    @PostMapping("/hospitals")
    public ResponseEntity<?> createHospital(@RequestBody Hospital hospital) {
        try {
            Hospital created = hospitalService.createHospital(hospital);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/hospitals/{id}")
    public ResponseEntity<?> updateHospital(@PathVariable Integer id, @RequestBody Hospital details) {
        try {
            Hospital updated = hospitalService.updateHospital(id, details);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/hospitals/{id}")
    public ResponseEntity<?> deleteHospital(@PathVariable Integer id) {
        try {
            hospitalService.deleteHospital(id);
            return ResponseEntity.ok("Hospital deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/hospitals/{id}/status")
    public ResponseEntity<?> updateHospitalStatus(@PathVariable Integer id, @RequestParam String status) {
        try {
            Hospital updated = hospitalService.updateHospitalStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/hospitals")
    public ResponseEntity<?> getHospitals() {
        return ResponseEntity.ok(hospitalService.getAllHospitals());
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Integer id, @RequestParam boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(active);
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<?> resetUserPassword(@PathVariable Integer id, @RequestParam String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok("Password reset successfully for user: " + user.getEmail());
    }

    @GetMapping("/inventory")
    public ResponseEntity<?> getInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }

    @GetMapping("/predictions")
    public ResponseEntity<?> getPredictions() {
        return ResponseEntity.ok(predictionService.getAllPredictions());
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getRequests() {
        return ResponseEntity.ok(requestService.getAllRequests());
    }

    @GetMapping("/logs")
    public ResponseEntity<?> getActivityLogs() {
        return ResponseEntity.ok(activityLogService.getAllActivityLogs());
    }
}
