package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.service.MonHocService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monhoc")
public class MonHocController {
	private final MonHocService monHocService;

	public MonHocController(MonHocService monHocService) {
		this.monHocService = monHocService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<MonHoc>>> getAll() {
		return ResponseEntity.ok(ApiResponse.ok(monHocService.getAll()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<MonHoc>> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(monHocService.getById(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<MonHoc>> create(@RequestBody MonHoc monHoc) {
		return ResponseEntity.ok(ApiResponse.ok(monHocService.create(monHoc)));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<MonHoc>> update(@PathVariable Integer id, @RequestBody MonHoc monHoc) {
		return ResponseEntity.ok(ApiResponse.ok(monHocService.update(id, monHoc)));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
		monHocService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
