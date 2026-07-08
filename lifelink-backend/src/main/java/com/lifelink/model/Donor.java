package com.lifelink.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "donors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Donor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "blood_group", nullable = false, length = 5)
    private String bloodGroup;

    @Column(name = "last_donation_date")
    private LocalDate lastDonationDate;

    @Column(length = 255)
    private String address;

    private Double latitude;
    private Double longitude;

    @Column(name = "contact_number", length = 20)
    private String contactNumber;

    @Column(name = "is_available")
    private Boolean isAvailable = true;
}
