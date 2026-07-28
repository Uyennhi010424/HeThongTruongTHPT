package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.user.RoleConfigDTO;
import com.hethongtruongthpt.service.RoleConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roles")
public class RoleConfigController {

    private final RoleConfigService roleConfigService;

    public RoleConfigController(RoleConfigService roleConfigService) {
        this.roleConfigService = roleConfigService;
    }

    @GetMapping("/configs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<RoleConfigDTO>>> getAllConfigs() {
        return ResponseEntity.ok(ApiResponse.ok(roleConfigService.getAllRoleConfigs()));
    }

    @PutMapping("/{role}/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoleConfigDTO>> updatePermissions(
            @PathVariable("role") String role,
            @RequestBody Map<String, Object> payload
    ) {
        try {
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
            RoleConfigDTO updated = roleConfigService.updateRolePermissions(role, json);
            return ResponseEntity.ok(ApiResponse.ok("Cập nhật quyền cho Vai trò thành công", updated));
        } catch (Exception e) {
            throw new com.hethongtruongthpt.exception.ApiException("Lỗi định dạng JSON");
        }
    }
}
