package com.lifelink.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hospital_admins")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HospitalAdmin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;
}
