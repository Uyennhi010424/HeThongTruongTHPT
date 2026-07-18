package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.tohopmon.ToHopMonDTO;
import com.hethongtruongthpt.service.ToHopMonService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tohopmon")
public class ToHopMonController {
    private final ToHopMonService toHopMonService;

    public ToHopMonController(ToHopMonService toHopMonService) {
        this.toHopMonService = toHopMonService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ToHopMonDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(toHopMonService.getAll()));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ToHopMonDTO>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(toHopMonService.getById(id)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<ToHopMonDTO>> create(@Valid @RequestBody ToHopMonDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(toHopMonService.create(dto)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ToHopMonDTO>> update(@PathVariable Integer id, @Valid @RequestBody ToHopMonDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(toHopMonService.update(id, dto)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
        toHopMonService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
    }
}
