package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.DanToc;
import com.hethongtruongthpt.service.DanTocService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dantoc")
public class DanTocController {
    private final DanTocService danTocService;

    public DanTocController(DanTocService danTocService) {
        this.danTocService = danTocService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DanToc>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(danTocService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DanToc>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(danTocService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DanToc>> create(@RequestBody DanToc danToc) {
        return ResponseEntity.ok(ApiResponse.ok(danTocService.create(danToc)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DanToc>> update(@PathVariable Integer id, @RequestBody DanToc danToc) {
        return ResponseEntity.ok(ApiResponse.ok(danTocService.update(id, danToc)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
        danTocService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
    }
}
