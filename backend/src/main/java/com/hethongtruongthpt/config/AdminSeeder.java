package com.hethongtruongthpt.config;

import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Order(1)
public class AdminSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String username = "admin";
        String rawPassword = "admin123@";

        User existing = userRepository.findByUsername(username).orElse(null);
        if (existing == null) {
            User admin = new User();
            admin.setUsername(username);
            admin.setPassword(passwordEncoder.encode(rawPassword));
            admin.setRole(RoleEnum.ADMIN);
            admin.setIsActive(true);
            admin.setLastLogin(LocalDateTime.now());
            userRepository.save(admin);
            return;
        }

        if (!passwordEncoder.matches(rawPassword, existing.getPassword())) {
            existing.setPassword(passwordEncoder.encode(rawPassword));
            existing.setRole(RoleEnum.ADMIN);
            existing.setIsActive(true);
            existing.setLastLogin(LocalDateTime.now());
            userRepository.save(existing);
        }
    }
}
