package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.AdminConfig;
import com.hethongtruongthpt.service.AdminConfigService;
import com.hethongtruongthpt.service.SmsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin-config")
public class AdminConfigController {
    private final AdminConfigService adminConfigService;
    private final SmsService smsService;

    public AdminConfigController(AdminConfigService adminConfigService, SmsService smsService) {
        this.adminConfigService = adminConfigService;
        this.smsService = smsService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<List<AdminConfig>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(adminConfigService.getAll()));
    }

    @GetMapping("/{key}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<AdminConfig>> getByKey(@PathVariable String key) {
        return ResponseEntity.ok(ApiResponse.ok(adminConfigService.getByKey(key)));
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminConfig>> upsert(
            @PathVariable String key,
            @RequestBody Map<String, String> body) {
        String value = body.getOrDefault("configValue", "");
        String description = body.get("description");
        return ResponseEntity.ok(ApiResponse.ok(adminConfigService.upsert(key, value, description)));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Object>> batchUpsert(@RequestBody Map<String, String> configs) {
        adminConfigService.upsertAll(configs);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật cấu hình thành công", null));
    }

    @DeleteMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable String key) {
        adminConfigService.deleteByKey(key);
        return ResponseEntity.ok(ApiResponse.ok("Xóa cấu hình thành công", null));
    }

    @PostMapping("/test-sms")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testSmsConnection() {
        return ResponseEntity.ok(ApiResponse.ok(smsService.testConnection()));
    }
}
