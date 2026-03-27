package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.service.GiaoVienService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/giaovien")
public class GiaoVienController {
	private final GiaoVienService giaoVienService;

	public GiaoVienController(GiaoVienService giaoVienService) {
		this.giaoVienService = giaoVienService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<GiaoVien>>> getAll() {
		return ResponseEntity.ok(ApiResponse.ok(giaoVienService.getAll()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<GiaoVien>> getById(@PathVariable("id") Long id) {
		return ResponseEntity.ok(ApiResponse.ok(giaoVienService.getById(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<GiaoVien>> create(@RequestBody GiaoVien giaoVien) {
		return ResponseEntity.ok(ApiResponse.ok(giaoVienService.create(giaoVien)));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<GiaoVien>> update(
			@PathVariable("id") Long id,
			@RequestBody GiaoVien giaoVien
	) {
		return ResponseEntity.ok(ApiResponse.ok(giaoVienService.update(id, giaoVien)));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable("id") Long id) {
		giaoVienService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
