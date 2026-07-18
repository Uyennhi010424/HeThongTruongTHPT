package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.HanhKiem;
import com.hethongtruongthpt.service.HanhKiemService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hanhkiem")
public class HanhKiemController {
	private final HanhKiemService hanhKiemService;

	public HanhKiemController(HanhKiemService hanhKiemService) {
		this.hanhKiemService = hanhKiemService;
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping
	public ResponseEntity<ApiResponse<List<HanhKiem>>> getAll(
			@RequestParam(required = false) Integer hocSinhId,
			@RequestParam(required = false) Integer giaoVienId,
			@RequestParam(required = false) Integer lopId,
			@RequestParam(required = false) Integer namHocId) {
		if (hocSinhId != null && namHocId != null) {
			return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.getByHocSinhAndNamHoc(hocSinhId, namHocId)));
		}
		if (hocSinhId != null) {
			return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.getByHocSinhId(hocSinhId)));
		}
		if (giaoVienId != null) {
			return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.getByGiaoVienId(giaoVienId)));
		}
		if (lopId != null && namHocId != null) {
			return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.getByLopAndNamHoc(lopId, namHocId)));
		}
		if (lopId != null) {
			return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.getByLop(lopId)));
		}
		return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.getAll()));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<HanhKiem>> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.getById(id)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PostMapping
	public ResponseEntity<ApiResponse<HanhKiem>> create(@Valid @RequestBody HanhKiem hanhKiem) {
		return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.create(hanhKiem)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PostMapping("/batch")
	public ResponseEntity<ApiResponse<List<HanhKiem>>> saveAll(@Valid @RequestBody List<HanhKiem> hanhKiemList) {
		return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.saveAll(hanhKiemList)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<HanhKiem>> update(@PathVariable Integer id, @Valid @RequestBody HanhKiem hanhKiem) {
		return ResponseEntity.ok(ApiResponse.ok(hanhKiemService.update(id, hanhKiem)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
		hanhKiemService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
