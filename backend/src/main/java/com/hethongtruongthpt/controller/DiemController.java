package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.service.DiemService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diem")
public class DiemController {
	private final DiemService diemService;

	public DiemController(DiemService diemService) {
		this.diemService = diemService;
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping
	public ResponseEntity<ApiResponse<List<Diem>>> getAll(
			@RequestParam(required = false) Integer hocSinhId,
			@RequestParam(required = false) Integer hocKy,
			@RequestParam(required = false) String namHoc,
			@RequestParam(required = false) Integer giaoVienId) {
		if (giaoVienId != null && hocKy != null && namHoc != null) {
			return ResponseEntity.ok(ApiResponse.ok(diemService.getByGiaoVienNhapIdAndHocKyAndNamHoc(giaoVienId, hocKy, namHoc)));
		}
		if (giaoVienId != null && namHoc != null) {
			return ResponseEntity.ok(ApiResponse.ok(diemService.getByGiaoVienNhapIdAndNamHoc(giaoVienId, namHoc)));
		}
		if (hocSinhId != null) {
			return ResponseEntity.ok(ApiResponse.ok(diemService.getByHocSinhId(hocSinhId)));
		}
		if (hocKy != null && namHoc != null) {
			return ResponseEntity.ok(ApiResponse.ok(diemService.getByHocKyAndNamHoc(hocKy, namHoc)));
		}
		if (namHoc != null) {
			return ResponseEntity.ok(ApiResponse.ok(diemService.getByNamHoc(namHoc)));
		}
		return ResponseEntity.ok(ApiResponse.ok(diemService.getAll()));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<Diem>> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(diemService.getById(id)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PostMapping
	public ResponseEntity<ApiResponse<Diem>> create(@Valid @RequestBody Diem diem) {
		return ResponseEntity.ok(ApiResponse.ok(diemService.create(diem)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PostMapping("/batch")
	public ResponseEntity<ApiResponse<List<Diem>>> saveAll(@Valid @RequestBody List<Diem> diemList) {
		return ResponseEntity.ok(ApiResponse.ok(diemService.saveAll(diemList)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<Diem>> update(@PathVariable Integer id, @Valid @RequestBody Diem diem) {
		return ResponseEntity.ok(ApiResponse.ok(diemService.update(id, diem)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
		diemService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping("/summary")
	public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSummary(
			@RequestParam(required = false) String namHoc,
			@RequestParam(required = false) Integer hocKy,
			@RequestParam(required = false) Integer lopId) {
		List<Map<String, Object>> result;
		if (namHoc != null && lopId != null) {
			result = diemService.getSummaryByNamHocAndLopId(namHoc, lopId);
		} else if (namHoc != null && hocKy != null) {
			result = diemService.getSummaryByNamHocAndHocKy(namHoc, hocKy);
		} else if (namHoc != null) {
			result = diemService.getSummaryByNamHoc(namHoc);
		} else {
			result = diemService.getSummaryAll();
		}
		return ResponseEntity.ok(ApiResponse.ok(result));
	}

	/**
	 * API nhanh: tính ĐTB theo khối trực tiếp trên server.
	 * Trả về [{khoi, avgScore, studentCount}] thay vì tải toàn bộ 67k+ records.
	 */
	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@GetMapping("/avg-by-grade")
	public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAvgByGrade(
			@RequestParam(required = false) String namHoc) {
		return ResponseEntity.ok(ApiResponse.ok(diemService.getAvgByGrade(namHoc)));
	}

	/**
	 * API nhanh: phân bố xếp loại (Giỏi/Khá/TB/Yếu/Kém).
	 */
	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@GetMapping("/distribution")
	public ResponseEntity<ApiResponse<Map<String, Object>>> getDistribution(
			@RequestParam(required = false) String namHoc,
			@RequestParam(required = false) Integer hocKy,
			@RequestParam(required = false) Integer khoi) {
		return ResponseEntity.ok(ApiResponse.ok(diemService.getDistribution(namHoc, hocKy, khoi)));
	}

	/**
	 * Xóa tất cả điểm theo năm học + học kỳ.
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/bulk")
	public ResponseEntity<ApiResponse<Map<String, Object>>> deleteByNamHocAndHocKy(
			@RequestParam String namHoc,
			@RequestParam(required = false) Integer hocKy) {
		long count = diemService.deleteByNamHocAndHocKy(namHoc, hocKy);
		return ResponseEntity.ok(ApiResponse.ok(Map.of("deleted", count)));
	}
}
