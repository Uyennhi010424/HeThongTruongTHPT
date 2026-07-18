package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.DanToc;
import com.hethongtruongthpt.service.DanTocService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dantoc")
@PreAuthorize("hasRole('ADMIN')")
public class DanTocController {
    private final DanTocService danTocService;

    public DanTocController(DanTocService danTocService) {
        this.danTocService = danTocService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            Page<DanToc> result = danTocService.getAllPaged(page, size);
            return ResponseEntity.ok(ApiResponse.ok(result));
        }
        return ResponseEntity.ok(ApiResponse.ok(danTocService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DanToc>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(danTocService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DanToc>> create(@Valid @RequestBody DanToc danToc) {
        return ResponseEntity.ok(ApiResponse.ok(danTocService.create(danToc)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DanToc>> update(@PathVariable Integer id, @Valid @RequestBody DanToc danToc) {
        return ResponseEntity.ok(ApiResponse.ok(danTocService.update(id, danToc)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
        danTocService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
    }
}
