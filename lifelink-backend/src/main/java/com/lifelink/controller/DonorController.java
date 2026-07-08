package com.lifelink.controller;

import com.lifelink.model.DonationHistory;
import com.lifelink.model.Donor;
import com.lifelink.service.DonorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/donors")
public class DonorController {

    @Autowired
    private DonorService donorService;

    @GetMapping
    public ResponseEntity<List<Donor>> getAllDonors() {
        return ResponseEntity.ok(donorService.getAllDonors());
    }

    @PostMapping("/log-donation")
    public ResponseEntity<?> logDonation(
            @RequestParam Integer donorId,
            @RequestParam Integer hospitalId,
            @RequestParam int units,
            @RequestParam String donationDate) {
        try {
            LocalDate date = LocalDate.parse(donationDate);
            DonationHistory history = donorService.logDonation(donorId, hospitalId, units, date);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/history/{donorId}")
    public ResponseEntity<List<DonationHistory>> getDonorHistory(@PathVariable Integer donorId) {
        return ResponseEntity.ok(donorService.getDonorHistory(donorId));
    }

    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<List<DonationHistory>> getDonationsAtHospital(@PathVariable Integer hospitalId) {
        return ResponseEntity.ok(donorService.getDonationsAtHospital(hospitalId));
    }
}
