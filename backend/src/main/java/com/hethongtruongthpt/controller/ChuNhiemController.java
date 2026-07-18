package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.chunhiem.ChuNhiemDTO;
import com.hethongtruongthpt.dto.chunhiem.ChuNhiemUpdateRequest;
import com.hethongtruongthpt.service.ChuNhiemService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/api/chunhiem")
@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
public class ChuNhiemController {
    private static final Logger logger = LoggerFactory.getLogger(ChuNhiemController.class);
    private final ChuNhiemService chuNhiemService;

    public ChuNhiemController(ChuNhiemService chuNhiemService) {
        this.chuNhiemService = chuNhiemService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        try {
            if (page != null && size != null) {
                Page<ChuNhiemDTO> result = chuNhiemService.getAllPaged(page, size);
                return ResponseEntity.ok(ApiResponse.ok(result));
            }
            return ResponseEntity.ok(ApiResponse.ok(chuNhiemService.getAll()));
        } catch (Exception ex) {
            logger.error("Lỗi khi lấy danh sách chủ nhiệm", ex);
            return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
        }
    }

    @GetMapping("/giaovien/{giaoVienId}")
        public ResponseEntity<ApiResponse<ChuNhiemDTO>> getByGiaoVien(
            @PathVariable("giaoVienId") Integer giaoVienId
        ) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(chuNhiemService.getByGiaoVienId(giaoVienId)));
        } catch (Exception ex) {
            logger.error("Lỗi khi lấy chủ nhiệm theo giáo viên id={}", giaoVienId, ex);
            return ResponseEntity.ok(ApiResponse.ok(null));
        }
    }

    @PutMapping("/giaovien/{giaoVienId}")
    public ResponseEntity<ApiResponse<ChuNhiemDTO>> updateByGiaoVien(
            @PathVariable("giaoVienId") Integer giaoVienId,
            @Valid @RequestBody ChuNhiemUpdateRequest request
    ) {
        ChuNhiemDTO result = chuNhiemService.assignByGiaoVienId(giaoVienId, request.getLopId());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/giaovien/{giaoVienId}")
    public ResponseEntity<ApiResponse<Object>> clearByGiaoVien(
            @PathVariable("giaoVienId") Integer giaoVienId
    ) {
        chuNhiemService.clearByGiaoVienId(giaoVienId);
        return ResponseEntity.ok(ApiResponse.ok("Đã bỏ phân công chủ nhiệm", null));
    }
}
