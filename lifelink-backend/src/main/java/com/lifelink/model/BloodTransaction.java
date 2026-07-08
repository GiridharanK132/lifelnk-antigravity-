package com.lifelink.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blood_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BloodTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "request_id")
    private EmergencyRequest request;

    @Column(name = "blood_group", nullable = false, length = 5)
    private String bloodGroup;

    @Column(nullable = false)
    private Integer units;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_hospital_id", nullable = false)
    private Hospital sourceHospital;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_hospital_id", nullable = false)
    private Hospital destinationHospital;

    @Column(name = "transaction_date")
    private LocalDateTime transactionDate = LocalDateTime.now();

    @Column(length = 20)
    private String status = "PENDING"; // PENDING, COMPLETED, CANCELLED

    @PrePersist
    protected void onCreate() {
        transactionDate = LocalDateTime.now();
    }
}
