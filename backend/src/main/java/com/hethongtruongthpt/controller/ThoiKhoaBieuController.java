package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.response.ThoiKhoaBieuResponse;
import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.service.ThoiKhoaBieuGeneratorService;
import com.hethongtruongthpt.service.ThoiKhoaBieuService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/thoikhoabieu")
public class ThoiKhoaBieuController {
	private final ThoiKhoaBieuService thoiKhoaBieuService;

	public ThoiKhoaBieuController(ThoiKhoaBieuService thoiKhoaBieuService) {
		this.thoiKhoaBieuService = thoiKhoaBieuService;
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping
	public ResponseEntity<ApiResponse<List<ThoiKhoaBieuResponse>>> getAll(
			@RequestParam(required = false) Integer lopId,
			@RequestParam(required = false) String namHoc,
			@RequestParam(required = false) Integer hocKy,
			@RequestParam(required = false) Integer tuan) {
		boolean isExamWeek = thoiKhoaBieuService.isExamWeek(namHoc, tuan);
		List<ThoiKhoaBieuResponse> res = thoiKhoaBieuService.getByFilter(lopId, namHoc, hocKy, tuan).stream()
				.map(ThoiKhoaBieuResponse::fromEntity).collect(java.util.stream.Collectors.toList());
		return ResponseEntity.ok(ApiResponse.ok(isExamWeek ? "TUAN_THI" : "OK", res));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<ThoiKhoaBieuResponse>> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(ThoiKhoaBieuResponse.fromEntity(thoiKhoaBieuService.getById(id))));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping
	public ResponseEntity<ApiResponse<ThoiKhoaBieuResponse>> create(@Valid @RequestBody ThoiKhoaBieu thoiKhoaBieu) {
		return ResponseEntity.ok(ApiResponse.ok(ThoiKhoaBieuResponse.fromEntity(thoiKhoaBieuService.create(thoiKhoaBieu))));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping("/generate")
	public ResponseEntity<ApiResponse<Map<String, Object>>> generate(
			@RequestParam String namHoc,
			@RequestParam Integer hocKy,
			@RequestParam(required = false, defaultValue = "1") Integer tuan) {
		try {
			ThoiKhoaBieuGeneratorService.GenerateResult result = thoiKhoaBieuService.generateScheduleForWeek(namHoc, hocKy, tuan);
			Map<String, Object> body = new HashMap<>();
			body.put("data", result.getCreated().stream().map(ThoiKhoaBieuResponse::fromEntity).collect(java.util.stream.Collectors.toList()));
			body.put("warnings", result.getWarnings());
			body.put("conflicts", result.getConflicts());
			return ResponseEntity.ok(ApiResponse.ok(body));
		} catch (ApiException e) {
			e.printStackTrace();
			return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi tạo TKB: " + e.getMessage()));
		}
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping("/generate-all")
	public ResponseEntity<ApiResponse<Map<String, Object>>> generateAll(
			@RequestParam String namHoc,
			@RequestParam Integer hocKy,
			@RequestParam Integer soTuan) {
		try {
			ThoiKhoaBieuGeneratorService.GenerateResult result = thoiKhoaBieuService.generateSchedule(namHoc, hocKy, soTuan);
			Map<String, Object> body = new HashMap<>();
			body.put("data", result.getCreated().stream().map(ThoiKhoaBieuResponse::fromEntity).collect(java.util.stream.Collectors.toList()));
			body.put("warnings", result.getWarnings());
			body.put("conflicts", result.getConflicts());
			return ResponseEntity.ok(ApiResponse.ok(body));
		} catch (ApiException e) {
			return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi tạo TKB hàng loạt: " + e.getMessage()));
		}
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping("/shuffle")
	public ResponseEntity<ApiResponse<Map<String, Object>>> shuffle(
			@RequestParam String namHoc,
			@RequestParam Integer hocKy,
			@RequestParam Integer tuan) {
		try {
			ThoiKhoaBieuGeneratorService.GenerateResult result = thoiKhoaBieuService.shuffleSchedule(namHoc, hocKy, tuan);
			Map<String, Object> body = new HashMap<>();
			body.put("data", result.getCreated().stream().map(ThoiKhoaBieuResponse::fromEntity).collect(java.util.stream.Collectors.toList()));
			body.put("warnings", result.getWarnings());
			body.put("conflicts", result.getConflicts());
			return ResponseEntity.ok(ApiResponse.ok(body));
		} catch (ApiException e) {
			return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi xáo trộn TKB: " + e.getMessage()));
		}
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<ThoiKhoaBieuResponse>> update(@PathVariable Integer id, @Valid @RequestBody ThoiKhoaBieu thoiKhoaBieu) {
		return ResponseEntity.ok(ApiResponse.ok(ThoiKhoaBieuResponse.fromEntity(thoiKhoaBieuService.update(id, thoiKhoaBieu))));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
		thoiKhoaBieuService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}

	/**
	 * Di chuyển TKB sang slot khác.
	 * PUT /api/thoikhoabieu/{id}/move?thu=3&tietBatDau=2
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}/move")
	public ResponseEntity<ApiResponse<ThoiKhoaBieuResponse>> moveEntry(
			@PathVariable Integer id,
			@RequestParam Integer thu,
			@RequestParam Integer tietBatDau) {
		try {
			ThoiKhoaBieu updated = thoiKhoaBieuService.moveEntry(id, thu, tietBatDau);
			return ResponseEntity.ok(ApiResponse.ok(ThoiKhoaBieuResponse.fromEntity(updated)));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi di chuyển TKB: " + e.getMessage()));
		}
	}

	/**
	 * Hoán đổi vị trí 2 mục TKB.
	 * POST /api/thoikhoabieu/swap?id1=1&id2=2
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping("/swap")
	public ResponseEntity<ApiResponse<Map<String, ThoiKhoaBieuResponse>>> swapEntries(
			@RequestParam Integer id1,
			@RequestParam Integer id2) {
		try {
			Map<String, ThoiKhoaBieu> result = thoiKhoaBieuService.swapEntries(id1, id2);
			Map<String, ThoiKhoaBieuResponse> mappedResult = new HashMap<>();
			result.forEach((k, v) -> mappedResult.put(k, ThoiKhoaBieuResponse.fromEntity(v)));
			return ResponseEntity.ok(ApiResponse.ok(mappedResult));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi hoán đổi TKB: " + e.getMessage()));
		}
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/bulk")
	public ResponseEntity<ApiResponse<Map<String, Object>>> deleteByNamHocAndHocKy(
			@RequestParam String namHoc,
			@RequestParam(required = false) Integer hocKy) {
		long count = thoiKhoaBieuService.deleteByNamHocAndHocKy(namHoc, hocKy);
		return ResponseEntity.ok(ApiResponse.ok(Map.of("deleted", count)));
	}
}
