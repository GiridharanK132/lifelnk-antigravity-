package com.lifelink.service;

import com.lifelink.model.*;
import com.lifelink.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class DonorService {

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private DonationHistoryRepository historyRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Donor> getAllDonors() {
        return donorRepository.findAll();
    }

    public Donor getDonorByUserId(Integer userId) {
        return donorRepository.findByUserId(userId)
                .orElse(null);
    }

    @Transactional
    public Donor registerDonor(Integer userId, String bloodGroup, String address, Double latitude, Double longitude, String contactNumber) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Donor donor = donorRepository.findByUserId(userId).orElse(new Donor());
        donor.setUser(user);
        donor.setBloodGroup(bloodGroup.toUpperCase());
        donor.setAddress(address);
        donor.setLatitude(latitude);
        donor.setLongitude(longitude);
        donor.setContactNumber(contactNumber);
        donor.setIsAvailable(true);

        return donorRepository.save(donor);
    }

    @Transactional
    public DonationHistory logDonation(Integer donorId, Integer hospitalId, int units, LocalDate donationDate) {
        Donor donor = donorRepository.findById(donorId)
                .orElseThrow(() -> new RuntimeException("Donor not found"));
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));

        DonationHistory history = new DonationHistory();
        history.setDonor(donor);
        history.setHospital(hospital);
        history.setUnits(units);
        history.setDonationDate(donationDate);
        history.setStatus("COMPLETED");

        DonationHistory savedHistory = historyRepository.save(history);

        donor.setLastDonationDate(donationDate);
        donorRepository.save(donor);

        return savedHistory;
    }

    public List<DonationHistory> getDonorHistory(Integer donorId) {
        return historyRepository.findByDonorId(donorId);
    }

    public List<DonationHistory> getDonationsAtHospital(Integer hospitalId) {
        return historyRepository.findByHospitalId(hospitalId);
    }
}
