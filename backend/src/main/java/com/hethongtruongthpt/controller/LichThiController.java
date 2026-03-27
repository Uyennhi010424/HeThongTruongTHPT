package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.LichThi;
import com.hethongtruongthpt.service.LichThiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lichthi")
public class LichThiController {
	private final LichThiService lichThiService;

	public LichThiController(LichThiService lichThiService) {
		this.lichThiService = lichThiService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<LichThi>>> getAll() {
		return ResponseEntity.ok(ApiResponse.ok(lichThiService.getAll()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<LichThi>> getById(@PathVariable Long id) {
		return ResponseEntity.ok(ApiResponse.ok(lichThiService.getById(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<LichThi>> create(@RequestBody LichThi lichThi) {
		return ResponseEntity.ok(ApiResponse.ok(lichThiService.create(lichThi)));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<LichThi>> update(@PathVariable Long id, @RequestBody LichThi lichThi) {
		return ResponseEntity.ok(ApiResponse.ok(lichThiService.update(id, lichThi)));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Long id) {
		lichThiService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
