package com.lifelink.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "donation_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DonationHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "donor_id", nullable = false)
    private Donor donor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Column(nullable = false)
    private Integer units;

    @Column(name = "donation_date", nullable = false)
    private LocalDate donationDate;

    @Column(length = 20)
    private String status = "COMPLETED"; // COMPLETED, CANCELLED, SCHEDULED
}
