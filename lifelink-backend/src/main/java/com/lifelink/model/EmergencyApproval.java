package com.lifelink.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_approvals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyApproval {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "request_id", nullable = false)
    private EmergencyRequest request;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Column(name = "approved_units", nullable = false)
    private Integer approvedUnits;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by", nullable = false)
    private User approvedBy;

    @Column(name = "approval_date")
    private LocalDateTime approvalDate = LocalDateTime.now();

    @Column(length = 20)
    private String status = "APPROVED"; // APPROVED, REJECTED

    @PrePersist
    protected void onCreate() {
        approvalDate = LocalDateTime.now();
    }
}
