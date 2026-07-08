package com.lifelink.controller;

import com.lifelink.model.*;
import com.lifelink.security.UserPrincipal;
import com.lifelink.service.DonorService;
import com.lifelink.service.HospitalService;
import com.lifelink.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @Autowired
    private HospitalService hospitalService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private DonorService donorService;

    @GetMapping("/hospitals")
    public ResponseEntity<List<Hospital>> getHospitals() {
        return ResponseEntity.ok(hospitalService.getAllHospitals());
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<BloodInventory>> getInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory().stream()
                .filter(s -> "AVAILABLE".equals(s.getStatus()))
                .toList());
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchBlood(@RequestParam String bloodGroup) {
        String bg = bloodGroup.trim().toUpperCase();
        List<BloodInventory> results = inventoryService.getAllInventory().stream()
                .filter(s -> "AVAILABLE".equals(s.getStatus()) && s.getBloodGroup().equals(bg))
                .toList();
        return ResponseEntity.ok(results);
    }

    @PostMapping("/donors/register")
    public ResponseEntity<?> registerDonor(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Donor donorRequest) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Authentication required to register as donor.");
        }
        try {
            Donor registered = donorService.registerDonor(
                    principal.getUser().getId(),
                    donorRequest.getBloodGroup(),
                    donorRequest.getAddress(),
                    donorRequest.getLatitude(),
                    donorRequest.getLongitude(),
                    donorRequest.getContactNumber()
            );
            return ResponseEntity.ok(registered);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/faqs")
    public ResponseEntity<?> getFaqs() {
        List<Map<String, String>> faqs = List.of(
            Map.of("q", "How can I register as a blood donor?", "a", "Sign up for an account, log in, and navigate to the 'Become a Donor' page. Fill in your location and blood type to get notified during local emergencies."),
            Map.of("q", "What is LifeLink AI?", "a", "LifeLink AI is an Agentic AI-driven hospital blood bank coordination network. It enables real-time inventory queries and automatic distance-priority stock allocation during emergency requests."),
            Map.of("q", "Who can edit blood stocks?", "a", "Only verified Hospital Blood Bank Admins can update the inventory for their own hospital. Public users have read-only access."),
            Map.of("q", "How does emergency allocation work?", "a", "When a doctor submits a high-priority request, the Coordinator Agent activates multiple AI agents to verify availability, calculate distances, score hospitals, split units if necessary, and alert admins for immediate approval.")
        );
        return ResponseEntity.ok(faqs);
    }
}
