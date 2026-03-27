package com.hethongtruongthpt.config;

import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.entity.PhanQuyen;
import com.hethongtruongthpt.entity.PhanQuyenId;
import com.hethongtruongthpt.entity.Roles;
import com.hethongtruongthpt.repository.PhanQuyenRepository;
import com.hethongtruongthpt.repository.RolesRepository;
import com.hethongtruongthpt.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RolesRepository rolesRepository;
    private final PhanQuyenRepository phanQuyenRepository;

    public AdminSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            RolesRepository rolesRepository,
            PhanQuyenRepository phanQuyenRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.rolesRepository = rolesRepository;
        this.phanQuyenRepository = phanQuyenRepository;
    }

    @Override
    public void run(String... args) {
        String username = "admin";
        String rawPassword = "admin123@";
        String email = "admin@gmail.com";

        User existing = userRepository.findByUsername(username).orElse(null);
        if (existing == null) {
            User admin = new User();
            admin.setUsername(username);
            admin.setPassword(passwordEncoder.encode(rawPassword));
            admin.setEmail(email);
            admin.setStatus(1);
            User saved = userRepository.save(admin);
            ensureAdminRole(saved);
            return;
        }

        if (!passwordEncoder.matches(rawPassword, existing.getPassword())) {
            existing.setPassword(passwordEncoder.encode(rawPassword));
            if (existing.getEmail() == null || existing.getEmail().isBlank()) {
                existing.setEmail(email);
            }
            if (existing.getStatus() == null) {
                existing.setStatus(1);
            }
            User saved = userRepository.save(existing);
            ensureAdminRole(saved);
            return;
        }

        ensureAdminRole(existing);
    }

    private void ensureAdminRole(User user) {
        if (user == null || user.getId() == null) {
            return;
        }
        if (!phanQuyenRepository.findByIdUserId(user.getId()).isEmpty()) {
            return;
        }
        Roles role = rolesRepository.findByRoleName("ADMIN")
                .orElseGet(() -> {
                    Roles created = new Roles();
                    Long maxId = rolesRepository.findMaxId();
                    created.setId(maxId + 1);
                    created.setRoleName("ADMIN");
                    return rolesRepository.save(created);
                });

        PhanQuyenId id = new PhanQuyenId();
        id.setUserId(user.getId());
        id.setRolesId(role.getId());

        PhanQuyen mapping = new PhanQuyen();
        mapping.setId(id);
        phanQuyenRepository.save(mapping);
    }
}
