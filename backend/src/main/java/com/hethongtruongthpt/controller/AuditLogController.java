package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.diem.DiemAuditLogDTO;
import com.hethongtruongthpt.service.AuditLogService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit-log")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {
    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DiemAuditLogDTO>>> getAll(
            @RequestParam(required = false) Integer giaoVienId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        if (giaoVienId != null || startDate != null || endDate != null) {
            return ResponseEntity.ok(ApiResponse.ok(auditLogService.getFiltered(giaoVienId, startDate, endDate)));
        }
        return ResponseEntity.ok(ApiResponse.ok(auditLogService.getAll()));
    }

    @GetMapping("/diem/{diemId}")
    public ResponseEntity<ApiResponse<List<DiemAuditLogDTO>>> getByDiemId(@PathVariable Integer diemId) {
        return ResponseEntity.ok(ApiResponse.ok(auditLogService.getByDiemId(diemId)));
    }

    @GetMapping("/hocsinh/{hocSinhId}")
    public ResponseEntity<ApiResponse<List<DiemAuditLogDTO>>> getByHocSinhId(
            @PathVariable Integer hocSinhId,
            @RequestParam(required = false) Integer monHocId) {
        return ResponseEntity.ok(ApiResponse.ok(auditLogService.getByHocSinhId(hocSinhId, monHocId)));
    }

    @GetMapping("/giaovien/{giaoVienId}")
    public ResponseEntity<ApiResponse<List<DiemAuditLogDTO>>> getByGiaoVienId(@PathVariable Integer giaoVienId) {
        return ResponseEntity.ok(ApiResponse.ok(auditLogService.getByGiaoVienId(giaoVienId)));
    }
}
