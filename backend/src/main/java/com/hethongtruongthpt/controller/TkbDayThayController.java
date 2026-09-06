package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.response.TkbDayThayResponse;
import com.hethongtruongthpt.dto.thoikhoabieu.TkbDayThayRequest;
import com.hethongtruongthpt.service.TkbDayThayService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tkb-day-thay")
public class TkbDayThayController {

    private final TkbDayThayService dayThayService;

    public TkbDayThayController(TkbDayThayService dayThayService) {
        this.dayThayService = dayThayService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<TkbDayThayResponse>>> getByNgay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ngay,
            @RequestParam(required = false) String namHoc) {
        List<TkbDayThayResponse> res = dayThayService.getByNgayAndNamHoc(ngay, namHoc).stream()
                .map(TkbDayThayResponse::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/range")
    public ResponseEntity<ApiResponse<List<TkbDayThayResponse>>> getByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String namHoc) {
        List<TkbDayThayResponse> res = dayThayService.getByRangeAndNamHoc(from, to, namHoc).stream()
                .map(TkbDayThayResponse::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/tkb/{tkbId}")
    public ResponseEntity<ApiResponse<List<TkbDayThayResponse>>> getByTkbId(@PathVariable Integer tkbId) {
        List<TkbDayThayResponse> res = dayThayService.getByTkbId(tkbId).stream()
                .map(TkbDayThayResponse::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<TkbDayThayResponse>>> getAll(
            @RequestParam(required = false) String namHoc) {
        List<TkbDayThayResponse> res = dayThayService.getAll(namHoc).stream()
                .map(TkbDayThayResponse::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<TkbDayThayResponse>> phanCongDayThay(@Valid @RequestBody TkbDayThayRequest body) {
        return ResponseEntity.ok(ApiResponse.ok("Phân công dạy thay thành công", 
                TkbDayThayResponse.fromEntity(dayThayService.phanCongDayThay(
                body.getTkbId(), body.getGiaoVienThayId(), body.getNgay(), body.getGhiChu()))));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> huyDayThay(@PathVariable Integer id) {
        dayThayService.huyDayThay(id);
        return ResponseEntity.ok(ApiResponse.ok("Hủy dạy thay thành công", null));
    }
}
