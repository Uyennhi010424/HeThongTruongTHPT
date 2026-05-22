package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.service.PhuHuynhService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/phuhuynh")
public class PhuHuynhController {
    private final PhuHuynhService phuHuynhService;

    public PhuHuynhController(PhuHuynhService phuHuynhService) {
        this.phuHuynhService = phuHuynhService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PhuHuynh>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(phuHuynhService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PhuHuynh>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(phuHuynhService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PhuHuynh>> create(@RequestBody PhuHuynh phuHuynh) {
        return ResponseEntity.ok(ApiResponse.ok(phuHuynhService.create(phuHuynh)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PhuHuynh>> update(@PathVariable Integer id, @RequestBody PhuHuynh phuHuynh) {
        return ResponseEntity.ok(ApiResponse.ok(phuHuynhService.update(id, phuHuynh)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
        phuHuynhService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
    }
}
