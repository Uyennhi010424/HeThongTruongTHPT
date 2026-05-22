package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.HocKy;
import com.hethongtruongthpt.service.HocKyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hocky")
public class HocKyController {
    private final HocKyService hocKyService;

    public HocKyController(HocKyService hocKyService) {
        this.hocKyService = hocKyService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HocKy>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(hocKyService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HocKy>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(hocKyService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HocKy>> create(@RequestBody HocKy hocKy) {
        return ResponseEntity.ok(ApiResponse.ok(hocKyService.create(hocKy)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HocKy>> update(@PathVariable Integer id, @RequestBody HocKy hocKy) {
        return ResponseEntity.ok(ApiResponse.ok(hocKyService.update(id, hocKy)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
        hocKyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
    }
}
