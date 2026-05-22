package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.service.NamHocService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/namhoc")
public class NamHocController {
    private final NamHocService namHocService;

    public NamHocController(NamHocService namHocService) {
        this.namHocService = namHocService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NamHoc>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(namHocService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NamHoc>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(namHocService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NamHoc>> create(@RequestBody NamHoc namHoc) {
        return ResponseEntity.ok(ApiResponse.ok(namHocService.create(namHoc)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<NamHoc>> update(@PathVariable Integer id, @RequestBody NamHoc namHoc) {
        return ResponseEntity.ok(ApiResponse.ok(namHocService.update(id, namHoc)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
        namHocService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
    }
}
