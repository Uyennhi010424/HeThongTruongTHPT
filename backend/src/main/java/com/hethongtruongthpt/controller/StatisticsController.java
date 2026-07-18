package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.statistics.AcademicStatistics;
import com.hethongtruongthpt.dto.statistics.AttendanceStatistics;
import com.hethongtruongthpt.dto.statistics.ConductStatistics;
import com.hethongtruongthpt.dto.statistics.OverviewStatistics;
import com.hethongtruongthpt.service.StatisticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/statistics")
@PreAuthorize("hasRole('ADMIN')")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<OverviewStatistics>> getOverview(
            @RequestParam String namHoc) {
        OverviewStatistics result = statisticsService.getOverview(namHoc);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/academic")
    public ResponseEntity<ApiResponse<AcademicStatistics>> getAcademicStats(
            @RequestParam String namHoc,
            @RequestParam(required = false) Integer khoi,
            @RequestParam(required = false) Integer lopId) {
        AcademicStatistics result = statisticsService.getAcademicStats(namHoc, khoi, lopId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/attendance")
    public ResponseEntity<ApiResponse<AttendanceStatistics>> getAttendanceStats(
            @RequestParam String namHoc,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        AttendanceStatistics result = statisticsService.getAttendanceStats(namHoc, from, to);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/conduct")
    public ResponseEntity<ApiResponse<ConductStatistics>> getConductStats(
            @RequestParam String namHoc,
            @RequestParam(required = false) Integer hocKy) {
        ConductStatistics result = statisticsService.getConductStats(namHoc, hocKy);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
