package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.service.HocSinhService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/hocsinh")
public class HocSinhController {
	private static final Logger log = LoggerFactory.getLogger(HocSinhController.class);
	private final HocSinhService hocSinhService;

	public HocSinhController(HocSinhService hocSinhService) {
		this.hocSinhService = hocSinhService;
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping
	public ResponseEntity<ApiResponse<?>> getAll(
			@RequestParam(value = "keyword", required = false) String keyword,
			@RequestParam(value = "lopId", required = false) Integer lopId,
			@RequestParam(value = "khoi", required = false) Integer khoi,
			@RequestParam(value = "page", required = false) Integer page,
			@RequestParam(value = "size", required = false) Integer size) {

		// If pagination params provided, return paginated result
		if (page != null && size != null) {
			Page<HocSinh> result = hocSinhService.search(
				keyword != null ? keyword : "", lopId, khoi, page, size);
			Map<String, Object> body = new HashMap<>();
			body.put("content", result.getContent());
			body.put("totalElements", result.getTotalElements());
			body.put("totalPages", result.getTotalPages());
			body.put("currentPage", result.getNumber());
			body.put("pageSize", result.getSize());
			return ResponseEntity.ok(ApiResponse.ok(body));
		}

		// If lopId provided without pagination, return list filtered by class
		if (lopId != null) {
			return ResponseEntity.ok(ApiResponse.ok(hocSinhService.getByLopId(lopId)));
		}

		// Otherwise return all (backward compatible)
		return ResponseEntity.ok(ApiResponse.ok(hocSinhService.getAll()));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@GetMapping("/stats")
	public ResponseEntity<ApiResponse<Map<String, Long>>> getStats() {
		Map<String, Long> stats = new LinkedHashMap<>();
		long total = hocSinhService.countByTrangThai(1) + hocSinhService.countByTrangThai(0);
		long active = hocSinhService.countByTrangThai(1);
		long paused = hocSinhService.countByTrangThai(0);
		stats.put("total", total);
		stats.put("active", active);
		stats.put("paused", paused);
		return ResponseEntity.ok(ApiResponse.ok(stats));
	}

	@PreAuthorize("isAuthenticated()")
	@GetMapping("/me")
	public ResponseEntity<ApiResponse<HocSinh>> getCurrentStudent() {
		try {
			String username = SecurityContextHolder.getContext().getAuthentication().getName();
			if (username == null || username.equals("anonymousUser")) {
				return ResponseEntity.ok(ApiResponse.ok(null));
			}
			HocSinh hocSinh = hocSinhService.getByUsername(username);
			return ResponseEntity.ok(ApiResponse.ok(hocSinh));
		} catch (Exception ex) {
			log.warn("Không thể lấy thông tin học sinh hiện tại: {}", ex.getMessage());
			return ResponseEntity.ok(ApiResponse.ok(null));
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<ApiResponse<HocSinh>> getById(@PathVariable("id") Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(hocSinhService.getById(id)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PostMapping
	public ResponseEntity<ApiResponse<HocSinh>> create(@Valid @RequestBody HocSinh hocSinh) {
		return ResponseEntity.ok(ApiResponse.ok(hocSinhService.create(hocSinh)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PutMapping("/{id:\\d+}")
	public ResponseEntity<ApiResponse<HocSinh>> update(@PathVariable("id") Integer id, @Valid @RequestBody HocSinh hocSinh) {
		return ResponseEntity.ok(ApiResponse.ok(hocSinhService.update(id, hocSinh)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@DeleteMapping("/{id:\\d+}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable("id") Integer id) {
		hocSinhService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Đã ngừng học cho học sinh", null));
	}

	@PreAuthorize("hasAnyRole('ADMIN')")
	@PostMapping("/{id:\\d+}/tot-nghiep")
	public ResponseEntity<ApiResponse<Object>> markGraduated(@PathVariable("id") Integer id) {
		hocSinhService.markGraduated(id);
		return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu tốt nghiệp cho học sinh", null));
	}

	@PreAuthorize("hasAnyRole('ADMIN')")
	@PostMapping("/tot-nghiep-lop12")
	public ResponseEntity<ApiResponse<Object>> markAllGrade12Graduated() {
		int count = hocSinhService.markAllGrade12Graduated();
		return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu tốt nghiệp cho " + count + " học sinh lớp 12", null));
	}
}
