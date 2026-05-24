package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.user.UserDTO;
import com.hethongtruongthpt.dto.user.UserRequest;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.hethongtruongthpt.exception.ApiException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private static final String DEFAULT_ACCOUNT_PASSWORD = "Abc1234@";

    public void resetPasswordToDefault(Integer id) {
        try {
            User existing = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
            String newRaw;
            if (existing.getRole() == RoleEnum.GIAO_VIEN && existing.getUsername() != null) {
                String username = existing.getUsername();
                String local = username.contains("@") ? username.substring(0, username.indexOf('@')) : username;
                newRaw = local + "gv123@";
            } else {
                newRaw = DEFAULT_ACCOUNT_PASSWORD;
            }
            existing.setPassword(passwordEncoder.encode(newRaw));
            userRepository.save(existing);
        } catch (Exception ex) {
            throw new ApiException("Không thể đặt lại mật khẩu: " + ex.getMessage());
        }
    }

    public List<UserDTO> getAll() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public UserDTO getById(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        return toDto(user);
    }

    public UserDTO create(UserRequest request) {
        String username = request.getUsername() == null ? null : request.getUsername().trim();
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username không được để trống");
        }

        if (userRepository.findByUsername(username).isPresent()) {
            // Reuse existing account to keep import flow idempotent.
            return toDto(userRepository.findByUsername(username).get());
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(normalizePassword(request.getPassword()));
        user.setRole(resolveRole(request.getRole()));
        user.setIsActive(resolveActive(request.getStatus()));
        User saved = userRepository.save(user);
        return toDto(saved);
    }

    public UserDTO update(Integer id, UserRequest request) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));

        existing.setUsername(request.getUsername());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            existing.setPassword(normalizePassword(request.getPassword()));
        }
        if (request.getRole() != null && !request.getRole().isBlank()) {
            existing.setRole(resolveRole(request.getRole()));
        }
        if (request.getStatus() != null) {
            existing.setIsActive(resolveActive(request.getStatus()));
        }

        User saved = userRepository.save(existing);
        return toDto(saved);
    }

    public void delete(Integer id) {
        userRepository.deleteById(id);
    }

    private String normalizePassword(String rawPassword) {
        if (rawPassword == null) {
            return null;
        }
        String trimmed = rawPassword.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.matches("^\\$2[aby]\\$\\d{2}\\$.+")) {
            return trimmed;
        }
        return passwordEncoder.encode(trimmed);
    }

    private RoleEnum resolveRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return null;
        }
        String raw = roleName.trim().toUpperCase();
        try {
            return RoleEnum.valueOf(raw);
        } catch (IllegalArgumentException ignored) {
        }

        // Accept frontend variants like "GIAOVIEN", "HOCSINH", "PHUHUYNH", "VAN_THU", etc.
        String cleaned = raw.replaceAll("[^A-Z0-9]", "");
        switch (cleaned) {
            case "GIAOVIEN":
                return RoleEnum.GIAO_VIEN;
            case "HOCSINH":
                return RoleEnum.HOC_SINH;
            case "PHUHUYNH":
                return RoleEnum.PHU_HUYNH;
            case "VANTHU":
                return RoleEnum.VAN_THU;
            case "ADMIN":
                return RoleEnum.ADMIN;
            default:
                throw new IllegalArgumentException("Unknown role: " + roleName);
        }
    }

    private boolean resolveActive(Integer status) {
        return status == null || status == 1;
    }

    private UserDTO toDto(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getUsername());
        dto.setRole(user.getRole());
        dto.setActive(user.getIsActive());
        dto.setStatus(Boolean.TRUE.equals(user.getIsActive()) ? 1 : 0);
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
