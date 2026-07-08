package com.lifelink.service;

import com.lifelink.model.*;
import com.lifelink.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {

    @Autowired
    private BloodInventoryRepository inventoryRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HospitalAdminRepository adminRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    public List<BloodInventory> getInventoryByHospital(Integer hospitalId) {
        return inventoryRepository.findByHospitalId(hospitalId);
    }

    public List<BloodInventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    @Transactional
    public BloodInventory addOrUpdateInventory(Integer hospitalId, String bloodGroup, int units, LocalDate collectionDate, LocalDate expiryDate, Integer userId) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        List<BloodInventory> existingList = inventoryRepository.findByHospitalIdAndBloodGroupAndStatus(hospitalId, bloodGroup, "AVAILABLE");
        
        Optional<BloodInventory> matchingStock = existingList.stream()
                .filter(item -> item.getExpiryDate().isEqual(expiryDate))
                .findFirst();

        BloodInventory stock;
        if (matchingStock.isPresent()) {
            stock = matchingStock.get();
            stock.setAvailableUnits(stock.getAvailableUnits() + units);
            stock.setLastUpdated(LocalDateTime.now());
            stock.setUpdatedBy(user);
        } else {
            stock = new BloodInventory();
            stock.setHospital(hospital);
            stock.setBloodGroup(bloodGroup.toUpperCase());
            stock.setAvailableUnits(units);
            stock.setCollectionDate(collectionDate);
            stock.setExpiryDate(expiryDate);
            stock.setStatus("AVAILABLE");
            stock.setUpdatedBy(user);
        }

        BloodInventory saved = inventoryRepository.save(stock);
        checkAndTriggerLowStockAlert(hospitalId, bloodGroup);
        return saved;
    }

    @Transactional
    public BloodInventory updateStockUnits(Integer id, int newUnits, Integer userId) {
        BloodInventory stock = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        stock.setAvailableUnits(newUnits);
        stock.setLastUpdated(LocalDateTime.now());
        stock.setUpdatedBy(user);

        if (newUnits == 0) {
            stock.setStatus("RESERVED");
        } else {
            stock.setStatus("AVAILABLE");
        }

        BloodInventory saved = inventoryRepository.save(stock);
        checkAndTriggerLowStockAlert(stock.getHospital().getId(), stock.getBloodGroup());
        return saved;
    }

    @Transactional
    public void checkAndTriggerLowStockAlert(Integer hospitalId, String bloodGroup) {
        List<BloodInventory> stocks = inventoryRepository.findByHospitalIdAndBloodGroupAndStatus(hospitalId, bloodGroup, "AVAILABLE");
        int totalUnits = stocks.stream().mapToInt(BloodInventory::getAvailableUnits).sum();

        if (totalUnits < 5) {
            List<HospitalAdmin> admins = adminRepository.findAll().stream()
                    .filter(a -> a.getHospital().getId().equals(hospitalId))
                    .toList();

            for (HospitalAdmin admin : admins) {
                Notification notif = new Notification();
                notif.setUser(admin.getUser());
                notif.setTitle("CRITICAL ALERT: Low Blood Stock");
                notif.setMessage(String.format("Critical stock level for blood group %s in your inventory. Total available units: %d. Please replenish stock immediately.",
                        bloodGroup, totalUnits));
                notif.setType("LOW_STOCK");
                notificationRepository.save(notif);
            }
        }
    }

    @Transactional
    public void scanAndHandleExpiredUnits() {
        LocalDate today = LocalDate.now();
        List<BloodInventory> activeStocks = inventoryRepository.findAll().stream()
                .filter(s -> "AVAILABLE".equals(s.getStatus()))
                .toList();

        for (BloodInventory stock : activeStocks) {
            if (stock.getExpiryDate().isBefore(today)) {
                stock.setStatus("EXPIRED");
                inventoryRepository.save(stock);

                List<HospitalAdmin> admins = adminRepository.findAll().stream()
                        .filter(a -> a.getHospital().getId().equals(stock.getHospital().getId()))
                        .toList();

                for (HospitalAdmin admin : admins) {
                    Notification notif = new Notification();
                    notif.setUser(admin.getUser());
                    notif.setTitle("ALERT: Expired Blood Inventory Removed");
                    notif.setMessage(String.format("%d units of %s blood group collected on %s have expired on %s and were marked as EXPIRED.",
                            stock.getAvailableUnits(), stock.getBloodGroup(), stock.getCollectionDate(), stock.getExpiryDate()));
                    notif.setType("EXPIRED_ALERT");
                    notificationRepository.save(notif);
                }
            }
        }
    }
}
