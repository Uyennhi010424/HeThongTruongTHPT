package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.TonGiao;
import com.hethongtruongthpt.service.TonGiaoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tongiao")
@PreAuthorize("hasRole('ADMIN')")
public class TonGiaoController {
    private final TonGiaoService tonGiaoService;

    public TonGiaoController(TonGiaoService tonGiaoService) {
        this.tonGiaoService = tonGiaoService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            Page<TonGiao> result = tonGiaoService.getAllPaged(page, size);
            return ResponseEntity.ok(ApiResponse.ok(result));
        }
        return ResponseEntity.ok(ApiResponse.ok(tonGiaoService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TonGiao>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(tonGiaoService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TonGiao>> create(@Valid @RequestBody TonGiao tonGiao) {
        return ResponseEntity.ok(ApiResponse.ok(tonGiaoService.create(tonGiao)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TonGiao>> update(@PathVariable Integer id, @Valid @RequestBody TonGiao tonGiao) {
        return ResponseEntity.ok(ApiResponse.ok(tonGiaoService.update(id, tonGiao)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
        tonGiaoService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
    }
}
