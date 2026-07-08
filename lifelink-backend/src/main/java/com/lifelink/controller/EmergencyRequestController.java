package com.lifelink.controller;

import com.lifelink.dto.AgentRecommendationResponse;
import com.lifelink.model.EmergencyRequest;
import com.lifelink.service.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class EmergencyRequestController {

    @Autowired
    private RequestService requestService;

    @PostMapping("/emergency")
    public ResponseEntity<?> submitEmergencyRequest(
            @RequestParam Integer requestingHospitalId,
            @RequestParam String bloodGroup,
            @RequestParam int unitsRequired,
            @RequestParam String priority) {
        try {
            AgentRecommendationResponse response = requestService.submitRequest(
                    requestingHospitalId, bloodGroup, unitsRequired, priority
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/emergency/{id}")
    public ResponseEntity<EmergencyRequest> getRequestById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(requestService.getRequestById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/emergency/hospital/{hospitalId}")
    public ResponseEntity<List<EmergencyRequest>> getRequestsByHospital(@PathVariable Integer hospitalId) {
        return ResponseEntity.ok(requestService.getRequestsByHospital(hospitalId));
    }

    @GetMapping("/emergency")
    public ResponseEntity<List<EmergencyRequest>> getAllRequests() {
        return ResponseEntity.ok(requestService.getAllRequests());
    }

    @GetMapping("/emergency/{id}/recommendation")
    public ResponseEntity<?> getRecommendation(@PathVariable Integer id) {
        String json = requestService.getAIRecommendation(id);
        if (json != null) {
            return ResponseEntity.ok(json);
        }
        return ResponseEntity.notFound().build();
    }
}
