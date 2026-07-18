package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.user.UserDTO;
import com.hethongtruongthpt.dto.user.UserRequest;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.util.DefaultAccountPasswordPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.hethongtruongthpt.exception.ApiException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DefaultAccountPasswordPolicy passwordPolicy;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, DefaultAccountPasswordPolicy passwordPolicy) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
    }

    public void resetPasswordToDefault(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        try {
            User existing = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
            String newRaw;
            if (existing.getRole() == RoleEnum.GIAO_VIEN && existing.getUsername() != null) {
                newRaw = passwordPolicy.getTeacherDefaultPassword(existing.getUsername());
            } else if (existing.getRole() == RoleEnum.PHU_HUYNH) {
                newRaw = passwordPolicy.getParentDefaultPassword();
            } else {
                newRaw = passwordPolicy.getStudentDefaultPassword();
            }
            existing.setPassword(passwordEncoder.encode(newRaw));
            existing.setMustChangePassword(true);
            userRepository.save(existing);
        } catch (Exception ex) {
            throw new ApiException("Không thể đặt lại mật khẩu: " + ex.getMessage());
        }
    }

    public void changePassword(Integer id, String oldPassword, String newPassword) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        if (oldPassword == null || oldPassword.isBlank()) {
            throw new ApiException("Mật khẩu cũ không được để trống");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new ApiException("Mật khẩu mới không được để trống");
        }

        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));

        String storedPassword = existing.getPassword();
        boolean isBcrypt = storedPassword != null && storedPassword.matches("^\\$2[aby]\\$\\d{2}\\$.+");

        if (!isBcrypt) {
            throw new ApiException("Tài khoản chưa được thiết lập mật khẩu an toàn. Vui lòng liên hệ quản trị viên.");
        }

        if (!passwordEncoder.matches(oldPassword, storedPassword)) {
            throw new ApiException("Mật khẩu cũ không chính xác");
        }

        existing.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(existing);
    }

    public List<UserDTO> getAll() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Page<UserDTO> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("username").ascending());
        return userRepository.findAll(pageable).map(this::toDto);
    }

    public UserDTO getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        return toDto(user);
    }

    public UserDTO getByUsername(String username) {
        if (username == null || username.isBlank()) return null;
        return userRepository.findByUsername(username.trim())
                .map(this::toDto)
                .orElse(null);
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

        // Generate default password server-side when none is provided
        String rawPassword = request.getPassword();
        if (rawPassword == null || rawPassword.isBlank()) {
            RoleEnum role = resolveRole(request.getRole());
            if (role == RoleEnum.GIAO_VIEN) {
                rawPassword = passwordPolicy.getTeacherDefaultPassword(username);
            } else {
                rawPassword = passwordPolicy.getStudentDefaultPassword();
            }
        }
        user.setPassword(normalizePassword(rawPassword));

        user.setRole(resolveRole(request.getRole()));
        user.setIsActive(resolveActive(request.getStatus()));
        user.setMustChangePassword(true);
        User saved = userRepository.save(user);
        return toDto(saved);
    }

    public UserDTO update(Integer id, UserRequest request) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
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
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
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
        } catch (IllegalArgumentException ex) {
            log.debug("Role '{}' không khớp enum trực tiếp, thử parse mở rộng", raw);
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
