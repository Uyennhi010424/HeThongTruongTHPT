package com.hethongtruongthpt.service;

import com.hethongtruongthpt.config.JwtTokenProvider;
import com.hethongtruongthpt.dto.auth.LoginRequest;
import com.hethongtruongthpt.dto.auth.LoginResponse;
import com.hethongtruongthpt.entity.PhanQuyen;
import com.hethongtruongthpt.entity.Roles;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.repository.PhanQuyenRepository;
import com.hethongtruongthpt.repository.RolesRepository;
import com.hethongtruongthpt.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final PhanQuyenRepository phanQuyenRepository;
    private final RolesRepository rolesRepository;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            PhanQuyenRepository phanQuyenRepository,
            RolesRepository rolesRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.phanQuyenRepository = phanQuyenRepository;
        this.rolesRepository = rolesRepository;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ApiException("Sai tài khoản hoặc mật khẩu"));
        String storedPassword = user.getPassword();
        if (storedPassword == null || storedPassword.isBlank()) {
            throw new ApiException("Sai tài khoản hoặc mật khẩu");
        }

        boolean isBcrypt = storedPassword.matches("^\\$2[aby]\\$\\d{2}\\$.+");
        boolean matches = isBcrypt
                ? passwordEncoder.matches(request.getPassword(), storedPassword)
                : request.getPassword().equals(storedPassword);

        if (!matches) {
            throw new ApiException("Sai tài khoản hoặc mật khẩu");
        }

        if (!isBcrypt) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            userRepository.save(user);
        }
        String token = jwtTokenProvider.generateToken(user.getUsername());
        String role = resolveRoleName(user.getId());
        return new LoginResponse(token, role);
    }

    private String resolveRoleName(Long userId) {
        if (userId == null) {
            return null;
        }
        List<PhanQuyen> mappings = phanQuyenRepository.findByIdUserId(userId);
        if (mappings.isEmpty()) {
            return null;
        }
        Long roleId = mappings.get(0).getId().getRolesId();
        Optional<Roles> role = rolesRepository.findById(roleId);
        return role.map(Roles::getRoleName).orElse(null);
    }
}