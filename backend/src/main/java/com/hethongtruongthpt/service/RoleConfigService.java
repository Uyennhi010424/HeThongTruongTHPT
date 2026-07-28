package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.user.RoleConfigDTO;
import com.hethongtruongthpt.entity.RoleConfig;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.RoleConfigRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RoleConfigService {

    private final RoleConfigRepository roleConfigRepository;

    public RoleConfigService(RoleConfigRepository roleConfigRepository) {
        this.roleConfigRepository = roleConfigRepository;
    }

    public List<RoleConfigDTO> getAllRoleConfigs() {
        return roleConfigRepository.findAll().stream()
                .map(rc -> new RoleConfigDTO(rc.getRole().name(), rc.getPermissions()))
                .collect(Collectors.toList());
    }

    public RoleConfigDTO updateRolePermissions(String roleStr, String permissionsJson) {
        RoleEnum role;
        try {
            role = RoleEnum.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Role không hợp lệ: " + roleStr);
        }

        Optional<RoleConfig> opt = roleConfigRepository.findByRole(role);
        RoleConfig config;
        if (opt.isPresent()) {
            config = opt.get();
        } else {
            config = new RoleConfig();
            config.setRole(role);
        }
        config.setPermissions(permissionsJson);
        config = roleConfigRepository.save(config);

        return new RoleConfigDTO(config.getRole().name(), config.getPermissions());
    }
}
