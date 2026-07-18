package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.giaovien.GiaoVienDTO;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.service.GiaoVienService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/giaovien")
public class GiaoVienController {
	private static final Logger log = LoggerFactory.getLogger(GiaoVienController.class);
	private final GiaoVienService giaoVienService;

	public GiaoVienController(GiaoVienService giaoVienService) {
		this.giaoVienService = giaoVienService;
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping
	public ResponseEntity<ApiResponse<?>> getAll(
			@RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer size) {
		if (page != null && size != null) {
			Page<GiaoVienDTO> result = giaoVienService.getAllPaged(page, size);
			return ResponseEntity.ok(ApiResponse.ok(result));
		}
		return ResponseEntity.ok(ApiResponse.ok(giaoVienService.getAll()));
	}

	@PreAuthorize("isAuthenticated()")
	@GetMapping("/me")
	public ResponseEntity<ApiResponse<GiaoVienDTO>> getCurrentTeacher() {
		try {
			String username = SecurityContextHolder.getContext().getAuthentication().getName();
			if (username == null || username.equals("anonymousUser")) {
				return ResponseEntity.ok(ApiResponse.ok(null));
			}
			GiaoVienDTO teacher = giaoVienService.getByUsername(username);
			return ResponseEntity.ok(ApiResponse.ok(teacher));
		} catch (Exception ex) {
			log.warn("Không thể lấy thông tin giáo viên hiện tại: {}", ex.getMessage());
			return ResponseEntity.ok(ApiResponse.ok(null));
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<ApiResponse<GiaoVienDTO>> getById(@PathVariable("id") Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(giaoVienService.getById(id)));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping
	public ResponseEntity<ApiResponse<GiaoVienDTO>> create(@Valid @RequestBody GiaoVien giaoVien) {
		return ResponseEntity.ok(ApiResponse.ok(giaoVienService.create(giaoVien)));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id:\\d+}")
	public ResponseEntity<ApiResponse<GiaoVienDTO>> update(
			@PathVariable("id") Integer id,
			@RequestBody GiaoVien giaoVien
	) {
		return ResponseEntity.ok(ApiResponse.ok(giaoVienService.update(id, giaoVien)));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id:\\d+}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable("id") Integer id) {
		giaoVienService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
