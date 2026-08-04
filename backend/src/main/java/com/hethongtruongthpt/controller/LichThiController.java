package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.LichThi;
import com.hethongtruongthpt.dto.AutoGenerateExamRequest;
import com.hethongtruongthpt.service.LichThiService;
import com.hethongtruongthpt.service.LichThiPdfService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lichthi")
@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
public class LichThiController {
	private final LichThiService lichThiService;
	private final LichThiPdfService lichThiPdfService;

	public LichThiController(LichThiService lichThiService, LichThiPdfService lichThiPdfService) {
		this.lichThiService = lichThiService;
		this.lichThiPdfService = lichThiPdfService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<?>> getAll(
			@RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer size,
			@RequestParam(required = false) String namHoc,
			@RequestParam(required = false) Integer hocKy) {
		if (namHoc != null && hocKy != null) {
			return ResponseEntity.ok(ApiResponse.ok(lichThiService.getByNamHocAndHocKy(namHoc, hocKy)));
		}
		if (page != null && size != null) {
			Page<LichThi> result = lichThiService.getAllPaged(page, size);
			return ResponseEntity.ok(ApiResponse.ok(result));
		}
		return ResponseEntity.ok(ApiResponse.ok(lichThiService.getAll()));
	}

	@GetMapping("/bylop")
	public ResponseEntity<ApiResponse<List<LichThi>>> getByLopId(@RequestParam Integer lopId) {
		return ResponseEntity.ok(ApiResponse.ok(lichThiService.getByLopId(lopId)));
	}

	@GetMapping("/action/check-exam-week")
	public ResponseEntity<ApiResponse<Boolean>> checkExamWeek(
			@RequestParam String namHoc,
			@RequestParam Integer tuan) {
		return ResponseEntity.ok(ApiResponse.ok(lichThiService.isExamWeek(namHoc, tuan)));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<LichThi>> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(lichThiService.getById(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<LichThi>> create(@Valid @RequestBody LichThi lichThi) {
		return ResponseEntity.ok(ApiResponse.ok(lichThiService.create(lichThi)));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<LichThi>> update(@PathVariable Integer id, @Valid @RequestBody LichThi lichThi) {
		return ResponseEntity.ok(ApiResponse.ok(lichThiService.update(id, lichThi)));
	}

	@PostMapping("/auto-generate")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<String>> autoGenerate(@RequestBody AutoGenerateExamRequest request) {
		lichThiService.autoGenerate(request);
		return ResponseEntity.ok(ApiResponse.ok("Tạo lịch thi tự động thành công", null));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
		lichThiService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}

	/**
	 * Xuất lịch thi ra PDF.
	 * GET /api/lichthi/export/pdf?namHoc=2025-2026&hocKy=1
	 */
	@SuppressWarnings("null")
	@GetMapping("/export/pdf")
	public ResponseEntity<byte[]> exportPdf(
			@RequestParam String namHoc,
			@RequestParam Integer hocKy) {
		try {
			byte[] pdfBytes = lichThiPdfService.generatePdf(namHoc, hocKy);

			return ResponseEntity.ok()
					.header(HttpHeaders.CONTENT_DISPOSITION,
							"attachment; filename=lich_thi_" + namHoc + "_hk" + hocKy + ".pdf")
					.contentType(MediaType.APPLICATION_PDF)
					.body(pdfBytes);
		} catch (Exception e) {
			return ResponseEntity.badRequest().build();
		}
	}
}
