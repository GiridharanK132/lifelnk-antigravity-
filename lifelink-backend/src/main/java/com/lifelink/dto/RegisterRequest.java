package com.lifelink.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String role; // ROLE_PUBLIC, ROLE_HOSPITAL_ADMIN, ROLE_SUPER_ADMIN
    private Integer hospitalId; // Mapping context for hospital admins
}
