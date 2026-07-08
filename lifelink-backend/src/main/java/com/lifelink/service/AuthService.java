package com.lifelink.service;

import com.lifelink.dto.*;
import com.lifelink.model.*;
import com.lifelink.repository.*;
import com.lifelink.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private HospitalAdminRepository hospitalAdminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Integer hospitalId = null;
        if ("ROLE_HOSPITAL_ADMIN".equals(user.getRole().getName())) {
            Optional<HospitalAdmin> mapping = hospitalAdminRepository.findByUser(user);
            if (mapping.isPresent()) {
                hospitalId = mapping.get().getHospital().getId();
            }
        }

        return new AuthResponse(jwt, user.getEmail(), user.getName(), user.getRole().getName(), user.getId(), hospitalId);
    }

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email address already in use.");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setIsActive(true);
        user.setIsVerified(false);
        user.setVerificationToken(UUID.randomUUID().toString());

        String roleName = request.getRole();
        if (roleName == null || roleName.trim().isEmpty()) {
            roleName = "ROLE_PUBLIC";
        } else if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName.toUpperCase();
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRole()));
        user.setRole(role);

        User savedUser = userRepository.save(user);

        if ("ROLE_HOSPITAL_ADMIN".equals(roleName) && request.getHospitalId() != null) {
            Hospital hospital = hospitalRepository.findById(request.getHospitalId())
                    .orElseThrow(() -> new RuntimeException("Hospital not found: " + request.getHospitalId()));
            HospitalAdmin adminMapping = new HospitalAdmin();
            adminMapping.setUser(savedUser);
            adminMapping.setHospital(hospital);
            hospitalAdminRepository.save(adminMapping);
        }

        return savedUser;
    }

    @Transactional
    public boolean verifyEmail(String token) {
        Optional<User> userOpt = userRepository.findByVerificationToken(token);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setIsVerified(true);
            user.setVerificationToken(null);
            userRepository.save(user);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setResetToken(UUID.randomUUID().toString());
            userRepository.save(user);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean resetPassword(String token, String newPassword) {
        Optional<User> userOpt = userRepository.findByResetToken(token);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setResetToken(null);
            userRepository.save(user);
            return true;
        }
        return false;
    }

    @Transactional
    public void changePassword(Integer userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Incorrect old password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
