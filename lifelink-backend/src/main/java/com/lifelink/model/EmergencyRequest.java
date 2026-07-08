package com.lifelink.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "requesting_hospital_id", nullable = false)
    private Hospital requestingHospital;

    @Column(name = "blood_group", nullable = false, length = 5)
    private String bloodGroup;

    @Column(name = "units_required", nullable = false)
    private Integer unitsRequired;

    @Column(nullable = false, length = 20)
    private String priority; // CRITICAL, HIGH, MEDIUM, NORMAL

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, ALLOCATED, COMPLETED, REJECTED

    @Column(name = "coordinator_notes")
    private String coordinatorNotes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
