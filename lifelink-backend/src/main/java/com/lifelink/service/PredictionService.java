package com.lifelink.service;

import com.lifelink.model.Prediction;
import com.lifelink.repository.PredictionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PredictionService {

    @Autowired
    private PredictionRepository predictionRepository;

    public List<Prediction> getAllPredictions() {
        return predictionRepository.findAll();
    }

    public List<Prediction> getPredictionsByHospital(Integer hospitalId) {
        return predictionRepository.findByHospitalId(hospitalId);
    }
}
