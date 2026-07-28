package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.LichNamHoc;
import com.hethongtruongthpt.service.LichNamHocService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/lichnamhoc")
public class LichNamHocController {
    private final LichNamHocService lichNamHocService;

    public LichNamHocController(LichNamHocService lichNamHocService) {
        this.lichNamHocService = lichNamHocService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
    @GetMapping("/holidays")
    public ResponseEntity<ApiResponse<List<LichNamHoc>>> getHolidays() {
        return ResponseEntity.ok(ApiResponse.ok(lichNamHocService.getHolidays()));
    }
}
