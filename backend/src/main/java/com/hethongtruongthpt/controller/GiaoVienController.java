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

	@PreAuthorize("hasRole('ADMIN')")
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

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping("/public")
	public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> getPublicTeachers() {
		java.util.List<java.util.Map<String, Object>> result = giaoVienService.getAll().stream()
			.map(gv -> {
				java.util.Map<String, Object> map = new java.util.HashMap<>();
				map.put("id", gv.getId());
				map.put("hoTen", gv.getHoTen());
				map.put("maGiaoVien", gv.getMaGiaoVien());
				map.put("boMon", gv.getBoMon());
				return map;
			})
			.collect(java.util.stream.Collectors.toList());
		return ResponseEntity.ok(ApiResponse.ok(result));
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

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PutMapping("/{id:\\d+}")
	public ResponseEntity<ApiResponse<GiaoVienDTO>> update(
			@PathVariable("id") Integer id,
			@RequestBody GiaoVien giaoVien
	) {
		org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
		if (!isAdmin) {
			String currentUsername = auth != null ? auth.getName() : null;
			GiaoVienDTO currentTeacher = giaoVienService.getByUsername(currentUsername);
			if (currentTeacher == null || !currentTeacher.getId().equals(id)) {
				throw new com.hethongtruongthpt.exception.ApiException("Bạn không có quyền cập nhật thông tin của giáo viên khác.");
			}
		}
		return ResponseEntity.ok(ApiResponse.ok(giaoVienService.update(id, giaoVien)));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id:\\d+}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable("id") Integer id) {
		giaoVienService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
