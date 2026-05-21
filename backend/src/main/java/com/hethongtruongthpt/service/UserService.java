package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.user.UserDTO;
import com.hethongtruongthpt.dto.user.UserRequest;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
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
        User user = new User();
        user.setUsername(request.getUsername());
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
        return RoleEnum.valueOf(roleName.trim().toUpperCase());
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
