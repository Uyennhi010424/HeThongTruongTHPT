package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.HanhKiem;
import com.hethongtruongthpt.service.HanhKiemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hanhkiem")
public class HanhKiemController {
	private final HanhKiemService hanhKiemService;

	public HanhKiemController(HanhKiemService hanhKiemService) {
		this.hanhKiemService = hanhKiemService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<HanhKiem>>> getAll() {
		return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.getAll()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<HanhKiem>> getById(@PathVariable Long id) {
		return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.getById(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<HanhKiem>> create(@RequestBody HanhKiem hanhKiem) {
		return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.create(hanhKiem)));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<HanhKiem>> update(@PathVariable Long id, @RequestBody HanhKiem hanhKiem) {
		return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.update(id, hanhKiem)));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Long id) {
		hanhKiemService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
