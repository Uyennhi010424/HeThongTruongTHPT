package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.HocKy;
import com.hethongtruongthpt.service.HocKyService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hocky")
@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
public class HocKyController {
    private final HocKyService hocKyService;

    public HocKyController(HocKyService hocKyService) {
        this.hocKyService = hocKyService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            Page<HocKy> result = hocKyService.getAllPaged(page, size);
            return ResponseEntity.ok(ApiResponse.ok(result));
        }
        return ResponseEntity.ok(ApiResponse.ok(hocKyService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HocKy>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(hocKyService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HocKy>> create(@Valid @RequestBody HocKy hocKy) {
        return ResponseEntity.ok(ApiResponse.ok(hocKyService.create(hocKy)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HocKy>> update(@PathVariable Integer id, @Valid @RequestBody HocKy hocKy) {
        return ResponseEntity.ok(ApiResponse.ok(hocKyService.update(id, hocKy)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
        hocKyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
    }
}
