package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.lophoc.LopHocBulkRequest;
import com.hethongtruongthpt.dto.lophoc.LopHocPromoteRequest;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.service.LopHocService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lophoc")
public class LopHocController {
	private final LopHocService lopHocService;

	public LopHocController(LopHocService lopHocService) {
		this.lopHocService = lopHocService;
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping
	public ResponseEntity<ApiResponse<?>> getAll(
			@RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer size) {
		if (page != null && size != null) {
			Page<LopHoc> result = lopHocService.getAllPaged(page, size);
			return ResponseEntity.ok(ApiResponse.ok(result));
		}
		return ResponseEntity.ok(ApiResponse.ok(lopHocService.getAll()));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<LopHoc>> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(lopHocService.getById(id)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PostMapping
	public ResponseEntity<ApiResponse<LopHoc>> create(@Valid @RequestBody LopHoc lopHoc) {
		return ResponseEntity.ok(ApiResponse.ok(lopHocService.create(lopHoc)));
	}

	/**
	 * Tao lop hang loat cho nam hoc moi.
	 */
	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PostMapping("/bulk")
	public ResponseEntity<ApiResponse<List<LopHoc>>> createBulk(@Valid @RequestBody LopHocBulkRequest request) {
		try {
			List<LopHoc> created = lopHocService.createBulk(
					request.getNamHoc(), request.getSoLop10(), request.getSoLop11(), request.getSoLop12());
			return ResponseEntity.ok(ApiResponse.ok(created));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi tạo lớp: " + e.getMessage()));
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<LopHoc>> update(@PathVariable Integer id, @Valid @RequestBody LopHoc lopHoc) {
		return ResponseEntity.ok(ApiResponse.ok(lopHocService.update(id, lopHoc)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
		lopHocService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}

	/**
	 * Len lop: chuyen hoc sinh tu nam hoc hien tai sang nam hoc moi.
	 */
	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PostMapping("/promote")
	public ResponseEntity<ApiResponse<Map<String, Object>>> promoteStudents(@Valid @RequestBody LopHocPromoteRequest request) {
		try {
			Map<String, Object> result = lopHocService.promoteStudents(
					request.getCurrentNamHoc(), request.getNextNamHoc());
			return ResponseEntity.ok(ApiResponse.ok(result));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi lên lớp: " + e.getMessage()));
		}
	}

	/**
	 * Dong bo siSo cho tat ca lop = so hoc sinh thuc te.
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping("/sync-siso")
	public ResponseEntity<ApiResponse<Map<String, Object>>> syncSiSo() {
		int updated = lopHocService.syncAllSiSo();
		return ResponseEntity.ok(ApiResponse.ok(Map.of("updated", updated)));
	}
}
