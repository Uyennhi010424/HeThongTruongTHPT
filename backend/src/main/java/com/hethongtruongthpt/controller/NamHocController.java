package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.service.NamHocService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/namhoc")
public class NamHocController {
    private final NamHocService namHocService;

    public NamHocController(NamHocService namHocService) {
        this.namHocService = namHocService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            Page<NamHoc> result = namHocService.getAllPaged(page, size);
            return ResponseEntity.ok(ApiResponse.ok(result));
        }
        return ResponseEntity.ok(ApiResponse.ok(namHocService.getAll()));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NamHoc>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(namHocService.getById(id)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<NamHoc>> create(@Valid @RequestBody NamHoc namHoc) {
        return ResponseEntity.ok(ApiResponse.ok(namHocService.create(namHoc)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<NamHoc>> update(@PathVariable Integer id, @Valid @RequestBody NamHoc namHoc) {
        return ResponseEntity.ok(ApiResponse.ok(namHocService.update(id, namHoc)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
        namHocService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
    }
}
