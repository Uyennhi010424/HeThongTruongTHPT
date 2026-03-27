package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import com.hethongtruongthpt.service.ThoiKhoaBieuService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/thoikhoabieu")
public class ThoiKhoaBieuController {
	private final ThoiKhoaBieuService thoiKhoaBieuService;

	public ThoiKhoaBieuController(ThoiKhoaBieuService thoiKhoaBieuService) {
		this.thoiKhoaBieuService = thoiKhoaBieuService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<ThoiKhoaBieu>>> getAll() {
		return ResponseEntity.ok(ApiResponse.ok(thoiKhoaBieuService.getAll()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<ThoiKhoaBieu>> getById(@PathVariable Long id) {
		return ResponseEntity.ok(ApiResponse.ok(thoiKhoaBieuService.getById(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<ThoiKhoaBieu>> create(@RequestBody ThoiKhoaBieu thoiKhoaBieu) {
		return ResponseEntity.ok(ApiResponse.ok(thoiKhoaBieuService.create(thoiKhoaBieu)));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<ThoiKhoaBieu>> update(@PathVariable Long id, @RequestBody ThoiKhoaBieu thoiKhoaBieu) {
		return ResponseEntity.ok(ApiResponse.ok(thoiKhoaBieuService.update(id, thoiKhoaBieu)));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Long id) {
		thoiKhoaBieuService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
