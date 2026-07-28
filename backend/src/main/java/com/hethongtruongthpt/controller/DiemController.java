package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.service.DiemService;
import com.hethongtruongthpt.service.DiemPdfService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diem")
public class DiemController {
	private final DiemService diemService;
	private final DiemPdfService diemPdfService;

	public DiemController(DiemService diemService, DiemPdfService diemPdfService) {
		this.diemService = diemService;
		this.diemPdfService = diemPdfService;
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping
	public ResponseEntity<ApiResponse<List<Diem>>> getAll(
			@RequestParam(required = false) Integer hocSinhId,
			@RequestParam(required = false) Integer hocKy,
			@RequestParam(required = false) String namHoc,
			@RequestParam(required = false) Integer giaoVienId,
			@RequestParam(required = false) Integer lopId) {
		if (giaoVienId != null && hocKy != null && namHoc != null) {
			return ResponseEntity.ok(ApiResponse.ok(diemService.getByGiaoVienNhapIdAndHocKyAndNamHoc(giaoVienId, hocKy, namHoc)));
		}
		if (giaoVienId != null && namHoc != null) {
			return ResponseEntity.ok(ApiResponse.ok(diemService.getByGiaoVienNhapIdAndNamHoc(giaoVienId, namHoc)));
		}
		if (hocSinhId != null) {
			return ResponseEntity.ok(ApiResponse.ok(diemService.getByHocSinhId(hocSinhId)));
		}
		if (lopId != null && hocKy != null && namHoc != null) {
			return ResponseEntity.ok(ApiResponse.ok(diemService.getByHocSinhLopIdAndHocKyAndNamHoc(lopId, hocKy, namHoc)));
		}
		if (hocKy != null && namHoc != null) {
			return ResponseEntity.ok(ApiResponse.ok(diemService.getByHocKyAndNamHoc(hocKy, namHoc)));
		}
		if (namHoc != null) {
			return ResponseEntity.ok(ApiResponse.ok(diemService.getByNamHoc(namHoc)));
		}
		return ResponseEntity.ok(ApiResponse.ok(diemService.getAll()));
	}

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/class-scoreboard")
    public ResponseEntity<ApiResponse<com.hethongtruongthpt.dto.ClassScoreboardDTO>> getClassScoreboard(
            @RequestParam String namHoc,
            @RequestParam Integer hocKy,
            @RequestParam Integer lopId) {
        return ResponseEntity.ok(ApiResponse.ok(diemService.getClassScoreboard(namHoc, hocKy, lopId)));
    }

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping("/export-student")
	public ResponseEntity<byte[]> exportStudentScorecard(
			@RequestParam Integer hocSinhId,
			@RequestParam Integer hocKy,
			@RequestParam String namHoc) {
		try {
			byte[] pdfBytes = diemPdfService.generateBangDiemHocSinhPdf(hocSinhId, hocKy, namHoc);
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_PDF);
			headers.setContentDispositionFormData("attachment", "bang_diem_" + hocSinhId + ".pdf");
			return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
		} catch (Exception e) {
			return ResponseEntity.internalServerError().build();
		}
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

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSummary(
            @RequestParam(required = false) String namHoc,
            @RequestParam(required = false) Integer hocKy,
            @RequestParam(required = false) Integer lopId) {
        if (namHoc != null && lopId != null) {
            return ResponseEntity.ok(ApiResponse.ok(diemService.getSummaryByNamHocAndLopId(namHoc, lopId)));
        } else if (namHoc != null && hocKy != null) {
            return ResponseEntity.ok(ApiResponse.ok(diemService.getSummaryByNamHocAndHocKy(namHoc, hocKy)));
        } else if (namHoc != null) {
            return ResponseEntity.ok(ApiResponse.ok(diemService.getSummaryByNamHoc(namHoc)));
        }
        return ResponseEntity.ok(ApiResponse.ok(diemService.getSummaryAll()));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/progress/summary")
    public ResponseEntity<ApiResponse<List<com.hethongtruongthpt.dto.DiemProgressDTO>>> getProgressSummary(
            @RequestParam String namHoc,
            @RequestParam Integer hocKy) {
        return ResponseEntity.ok(ApiResponse.ok(diemService.getProgressSummary(namHoc, hocKy)));
    }
    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/progress/class-summary")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getClassProgressSummary(
            @RequestParam String namHoc,
            @RequestParam Integer hocKy,
            @RequestParam Integer lopId) {
        return ResponseEntity.ok(ApiResponse.ok(diemService.getClassProgressSummary(namHoc, hocKy, lopId)));
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
