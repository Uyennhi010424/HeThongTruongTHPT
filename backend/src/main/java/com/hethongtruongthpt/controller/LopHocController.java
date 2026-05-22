package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.service.LopHocService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lophoc")
public class LopHocController {
	private final LopHocService lopHocService;

	public LopHocController(LopHocService lopHocService) {
		this.lopHocService = lopHocService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<LopHoc>>> getAll() {
		return ResponseEntity.ok(ApiResponse.ok(lopHocService.getAll()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<LopHoc>> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(lopHocService.getById(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<LopHoc>> create(@RequestBody LopHoc lopHoc) {
		return ResponseEntity.ok(ApiResponse.ok(lopHocService.create(lopHoc)));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<LopHoc>> update(@PathVariable Integer id, @RequestBody LopHoc lopHoc) {
		return ResponseEntity.ok(ApiResponse.ok(lopHocService.update(id, lopHoc)));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
		lopHocService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
