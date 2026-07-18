package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.DiemDanh;
import com.hethongtruongthpt.service.DiemDanhService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diemdanh")
@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
public class DiemDanhController {
    private final DiemDanhService service;

    public DiemDanhController(DiemDanhService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DiemDanh>>> get(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ngay,
            @RequestParam Integer lopHocId,
            @RequestParam(required = false) Integer tietHoc) {
        if (tietHoc != null) {
            return ResponseEntity.ok(ApiResponse.ok(service.getByNgayAndLopHocIdAndTietHoc(ngay, lopHocId, tietHoc)));
        }
        return ResponseEntity.ok(ApiResponse.ok(service.getByNgayAndLopHocId(ngay, lopHocId)));
    }

    @GetMapping("/lock")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> isLocked(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ngay,
            @RequestParam Integer lopHocId,
            @RequestParam(required = false) Integer tietHoc) {
        boolean locked;
        if (tietHoc != null) {
            locked = service.isLocked(ngay, lopHocId, tietHoc);
        } else {
            locked = service.isLocked(ngay, lopHocId);
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("locked", locked)));
    }

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<List<DiemDanh>>> saveAll(@Valid @RequestBody List<DiemDanh> records) {
        return ResponseEntity.ok(ApiResponse.ok(service.saveAll(records)));
    }

    /**
     * Thong ke chuyen can cho mot lop.
     * GET /api/diemdanh/statistics?lopId=1&from=2025-09-01&to=2026-05-31
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics(
            @RequestParam Integer lopId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(service.getStatistics(lopId, from, to)));
    }

    /**
     * Thong ke chuyen can cho mot hoc sinh.
     * GET /api/diemdanh/statistics/student?hocSinhId=1&from=2025-09-01&to=2026-05-31
     */
    @GetMapping("/statistics/student")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudentStatistics(
            @RequestParam Integer hocSinhId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(service.getStudentStatistics(hocSinhId, from, to)));
    }
}
