package com.hethongtruongthpt.config;

import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Component
@Order(1)
public class AdminSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_USERNAME:admin}")
    private String adminUsername;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    @Value("${ADMIN_RESET_PASSWORD:false}")
    private boolean resetPassword;

    public AdminSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            seedAdmin();
        } catch (Exception ex) {
            log.error("Không thể seed tài khoản admin. Kiểm tra CSDL hethongthpt và bảng users.", ex);
        }
    }

    private void seedAdmin() {
        User existing = userRepository.findByUsername(adminUsername).orElse(null);
        if (existing != null) {
            // Admin already exists – check if reset is requested
            if (resetPassword && adminPassword != null && !adminPassword.isBlank()) {
                existing.setPassword(passwordEncoder.encode(adminPassword));
                existing.setIsActive(true);
                existing.setMustChangePassword(true);
                userRepository.save(existing);
                log.warn("========================================");
                log.warn("Đã reset mật khẩu admin!");
                log.warn("  Username: {}", adminUsername);
                log.warn("  Password: {}", adminPassword);
                log.warn("Hãy đổi mật khẩu sau khi đăng nhập!");
                log.warn("========================================");
            } else {
                log.info("Admin '{}' đã tồn tại. Bỏ qua seeding.", adminUsername);
            }
            return;
        }

        String rawPassword = adminPassword;
        if (rawPassword == null || rawPassword.isBlank()) {
            rawPassword = generateRandomPassword();
            log.warn("========================================");
            log.warn("Admin password (ADMIN_PASSWORD) chưa được set. Mật khẩu ngẫu nhiên:");
            log.warn("  Username: {}", adminUsername);
            log.warn("  Password: {}", rawPassword);
            log.warn("Hãy đổi mật khẩu sau khi đăng nhập!");
            log.warn("========================================");
        }

        User admin = new User();
        admin.setUsername(adminUsername);
        admin.setPassword(passwordEncoder.encode(rawPassword));
        admin.setRole(RoleEnum.ADMIN);
        admin.setIsActive(true);
        admin.setMustChangePassword(true);
        admin.setLastLogin(LocalDateTime.now());
        userRepository.save(admin);
        log.info("Đã tạo tài khoản admin: {}", adminUsername);
    }

    private static String generateRandomPassword() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[18];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
