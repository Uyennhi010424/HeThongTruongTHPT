package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.service.DiemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diem")
public class DiemController {
	private final DiemService diemService;

	public DiemController(DiemService diemService) {
		this.diemService = diemService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<Diem>>> getAll() {
		return ResponseEntity.ok(ApiResponse.ok(diemService.getAll()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<Diem>> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(diemService.getById(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<Diem>> create(@RequestBody Diem diem) {
		return ResponseEntity.ok(ApiResponse.ok(diemService.create(diem)));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<Diem>> update(@PathVariable Integer id, @RequestBody Diem diem) {
		return ResponseEntity.ok(ApiResponse.ok(diemService.update(id, diem)));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
		diemService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
