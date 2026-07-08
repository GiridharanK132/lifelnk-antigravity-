package com.lifelink.service;

import com.lifelink.model.Hospital;
import com.lifelink.repository.HospitalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HospitalService {

    @Autowired
    private HospitalRepository hospitalRepository;

    public List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }

    public Hospital getHospitalById(Integer id) {
        return hospitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hospital not found with id: " + id));
    }

    @Transactional
    public Hospital createHospital(Hospital hospital) {
        hospital.setStatus("ACTIVE");
        return hospitalRepository.save(hospital);
    }

    @Transactional
    public Hospital updateHospital(Integer id, Hospital hospitalDetails) {
        Hospital hospital = getHospitalById(id);
        hospital.setName(hospitalDetails.getName());
        hospital.setAddress(hospitalDetails.getAddress());
        hospital.setLatitude(hospitalDetails.getLatitude());
        hospital.setLongitude(hospitalDetails.getLongitude());
        hospital.setContactNumber(hospitalDetails.getContactNumber());
        hospital.setEmail(hospitalDetails.getEmail());
        if (hospitalDetails.getStatus() != null) {
            hospital.setStatus(hospitalDetails.getStatus());
        }
        return hospitalRepository.save(hospital);
    }

    @Transactional
    public void deleteHospital(Integer id) {
        Hospital hospital = getHospitalById(id);
        hospitalRepository.delete(hospital);
    }

    @Transactional
    public Hospital updateHospitalStatus(Integer id, String status) {
        Hospital hospital = getHospitalById(id);
        hospital.setStatus(status.toUpperCase());
        return hospitalRepository.save(hospital);
    }
}
