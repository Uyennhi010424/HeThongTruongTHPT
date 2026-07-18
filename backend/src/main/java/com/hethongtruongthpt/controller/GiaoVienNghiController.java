package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.giaovien.GiaoVienNghiRequest;
import com.hethongtruongthpt.entity.GiaoVienNghi;
import com.hethongtruongthpt.service.GiaoVienNghiService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/giao-vien-nghi")
public class GiaoVienNghiController {

    private final GiaoVienNghiService nghiService;

    public GiaoVienNghiController(GiaoVienNghiService nghiService) {
        this.nghiService = nghiService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<GiaoVienNghi>>> getByNgay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ngay,
            @RequestParam(required = false) String namHoc) {
        return ResponseEntity.ok(ApiResponse.ok(nghiService.getByNgayAndNamHoc(ngay, namHoc)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/nam-hoc")
    public ResponseEntity<ApiResponse<List<GiaoVienNghi>>> getByNamHoc(
            @RequestParam String namHoc) {
        return ResponseEntity.ok(ApiResponse.ok(nghiService.getByNamHoc(namHoc)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/giao-vien/{id}")
    public ResponseEntity<ApiResponse<List<GiaoVienNghi>>> getByGiaoVien(
            @PathVariable Integer id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(nghiService.getByGiaoVienAndRange(id, from, to)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<GiaoVienNghi>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(nghiService.getAll()));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @PostMapping
    public ResponseEntity<ApiResponse<GiaoVienNghi>> dangKyNghi(@Valid @RequestBody GiaoVienNghiRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(nghiService.dangKyNghi(
                body.getGiaoVienId(), body.getNgay(), body.getNamHoc(),
                body.getLyDo(), body.getGhiChu())));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/duyet")
    public ResponseEntity<ApiResponse<GiaoVienNghi>> duyetNghi(
            @PathVariable Integer id,
            @Valid @RequestBody com.hethongtruongthpt.dto.giaovien.DuyetNghiRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(nghiService.duyetNghi(
                id, body.getTrangThai(), body.getLyDoTuChoi(), body.getGiaoVienThayId())));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> huyNghi(@PathVariable Integer id) {
        nghiService.huyNghi(id);
        return ResponseEntity.ok(ApiResponse.ok("Hủy nghỉ thành công", null));
    }
}
