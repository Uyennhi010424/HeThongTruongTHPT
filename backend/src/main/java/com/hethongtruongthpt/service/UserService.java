package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.user.UserDTO;
import com.hethongtruongthpt.dto.user.UserRequest;
import com.hethongtruongthpt.entity.PhanQuyen;
import com.hethongtruongthpt.entity.PhanQuyenId;
import com.hethongtruongthpt.entity.Roles;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.PhanQuyenRepository;
import com.hethongtruongthpt.repository.RolesRepository;
import com.hethongtruongthpt.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RolesRepository rolesRepository;
    private final PhanQuyenRepository phanQuyenRepository;

    public UserService(
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

    public List<UserDTO> getAll() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public UserDTO getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        return toDto(user);
    }

    public UserDTO create(UserRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setStatus(request.getStatus());
        user.setPassword(normalizePassword(request.getPassword()));
        User saved = userRepository.save(user);

        assignRoleIfPresent(saved.getId(), request.getRole());

        return toDto(saved);
    }

    public UserDTO update(Long id, UserRequest request) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));

        existing.setUsername(request.getUsername());
        existing.setEmail(request.getEmail());
        existing.setStatus(request.getStatus());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            existing.setPassword(normalizePassword(request.getPassword()));
        }

        User saved = userRepository.save(existing);
        updateRoleIfPresent(saved.getId(), request.getRole());

        return toDto(saved);
    }

    public void delete(Long id) {
        phanQuyenRepository.deleteByIdUserId(id);
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

    private UserDTO toDto(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setActive(user.getStatus() != null && user.getStatus() == 1);
        dto.setStatus(user.getStatus());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        String roleName = resolveRoleName(user.getId());
        if (roleName != null) {
            try {
                dto.setRole(RoleEnum.valueOf(roleName));
            } catch (IllegalArgumentException ignored) {
                dto.setRole(null);
            }
        }
        return dto;
    }

    private String resolveRoleName(Long userId) {
        List<PhanQuyen> mappings = phanQuyenRepository.findByIdUserId(userId);
        if (mappings.isEmpty()) {
            return null;
        }
        Long roleId = mappings.get(0).getId().getRolesId();
        Optional<Roles> role = rolesRepository.findById(roleId);
        return role.map(Roles::getRoleName).orElse(null);
    }

    private void assignRoleIfPresent(Long userId, String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return;
        }
        String normalized = roleName.trim().toUpperCase();
        Roles role = rolesRepository.findByRoleName(normalized)
                .orElseGet(() -> {
                    Roles created = new Roles();
                    Long maxId = rolesRepository.findMaxId();
                    created.setId(maxId + 1);
                    created.setRoleName(normalized);
                    return rolesRepository.save(created);
                });

        PhanQuyenId id = new PhanQuyenId();
        id.setUserId(userId);
        id.setRolesId(role.getId());

        PhanQuyen mapping = new PhanQuyen();
        mapping.setId(id);
        phanQuyenRepository.save(mapping);
    }

    private void updateRoleIfPresent(Long userId, String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return;
        }
        phanQuyenRepository.deleteByIdUserId(userId);
        assignRoleIfPresent(userId, roleName);
    }
}