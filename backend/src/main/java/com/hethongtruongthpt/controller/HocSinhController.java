package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.service.HocSinhService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hocsinh")
public class HocSinhController {
	private final HocSinhService hocSinhService;

	public HocSinhController(HocSinhService hocSinhService) {
		this.hocSinhService = hocSinhService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<HocSinh>>> getAll() {
		return ResponseEntity.ok(ApiResponse.ok(hocSinhService.getAll()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<HocSinh>> getById(@PathVariable("id") Long id) {
		return ResponseEntity.ok(ApiResponse.ok(hocSinhService.getById(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<HocSinh>> create(@RequestBody HocSinh hocSinh) {
		return ResponseEntity.ok(ApiResponse.ok(hocSinhService.create(hocSinh)));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<HocSinh>> update(@PathVariable("id") Long id, @RequestBody HocSinh hocSinh) {
		return ResponseEntity.ok(ApiResponse.ok(hocSinhService.update(id, hocSinh)));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable("id") Long id) {
		hocSinhService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
