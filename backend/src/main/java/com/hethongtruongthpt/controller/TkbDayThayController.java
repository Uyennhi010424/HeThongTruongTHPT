package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.thoikhoabieu.TkbDayThayRequest;
import com.hethongtruongthpt.entity.TkbDayThay;
import com.hethongtruongthpt.service.TkbDayThayService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tkb-day-thay")
public class TkbDayThayController {

    private final TkbDayThayService dayThayService;

    public TkbDayThayController(TkbDayThayService dayThayService) {
        this.dayThayService = dayThayService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<TkbDayThay>>> getByNgay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ngay,
            @RequestParam(required = false) String namHoc) {
        return ResponseEntity.ok(ApiResponse.ok(dayThayService.getByNgayAndNamHoc(ngay, namHoc)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/range")
    public ResponseEntity<ApiResponse<List<TkbDayThay>>> getByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String namHoc) {
        return ResponseEntity.ok(ApiResponse.ok(dayThayService.getByRangeAndNamHoc(from, to, namHoc)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/tkb/{tkbId}")
    public ResponseEntity<ApiResponse<List<TkbDayThay>>> getByTkbId(@PathVariable Integer tkbId) {
        return ResponseEntity.ok(ApiResponse.ok(dayThayService.getByTkbId(tkbId)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<TkbDayThay>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(dayThayService.getAll()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<TkbDayThay>> phanCongDayThay(@Valid @RequestBody TkbDayThayRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(dayThayService.phanCongDayThay(
                body.getTkbId(), body.getGiaoVienThayId(), body.getNgay(), body.getGhiChu())));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> huyDayThay(@PathVariable Integer id) {
        dayThayService.huyDayThay(id);
        return ResponseEntity.ok(ApiResponse.ok("Hủy dạy thay thành công", null));
    }
}
