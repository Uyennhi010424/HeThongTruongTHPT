package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.ThongBao;
import com.hethongtruongthpt.service.ThongBaoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/thongbao")
public class ThongBaoController {
	private final ThongBaoService thongBaoService;

	public ThongBaoController(ThongBaoService thongBaoService) {
		this.thongBaoService = thongBaoService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<ThongBao>>> getAll() {
		return ResponseEntity.ok(ApiResponse.ok(thongBaoService.getAll()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<ThongBao>> getById(@PathVariable Long id) {
		return ResponseEntity.ok(ApiResponse.ok(thongBaoService.getById(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<ThongBao>> create(@RequestBody ThongBao thongBao) {
		return ResponseEntity.ok(ApiResponse.ok(thongBaoService.create(thongBao)));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<ThongBao>> update(@PathVariable Long id, @RequestBody ThongBao thongBao) {
		return ResponseEntity.ok(ApiResponse.ok(thongBaoService.update(id, thongBao)));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Long id) {
		thongBaoService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
