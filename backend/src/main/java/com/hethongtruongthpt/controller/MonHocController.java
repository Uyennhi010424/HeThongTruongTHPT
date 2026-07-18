package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.service.MonHocService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/monhoc")
public class MonHocController {
	private final MonHocService monHocService;

	public MonHocController(MonHocService monHocService) {
		this.monHocService = monHocService;
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping
	public ResponseEntity<ApiResponse<?>> getAll(
			@RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer size) {
		if (page != null && size != null) {
			Page<MonHoc> result = monHocService.getAllPaged(page, size);
			return ResponseEntity.ok(ApiResponse.ok(result));
		}
		return ResponseEntity.ok(ApiResponse.ok(monHocService.getAll()));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<MonHoc>> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(monHocService.getById(id)));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping
	public ResponseEntity<ApiResponse<MonHoc>> create(@Valid @RequestBody MonHoc monHoc) {
		return ResponseEntity.ok(ApiResponse.ok(monHocService.create(monHoc)));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<MonHoc>> update(@PathVariable Integer id, @Valid @RequestBody MonHoc monHoc) {
		return ResponseEntity.ok(ApiResponse.ok(monHocService.update(id, monHoc)));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
		monHocService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
