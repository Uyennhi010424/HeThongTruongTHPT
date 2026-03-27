package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.chunhiem.ChuNhiemDTO;
import com.hethongtruongthpt.dto.chunhiem.ChuNhiemUpdateRequest;
import com.hethongtruongthpt.service.ChuNhiemService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/chunhiem")
public class ChuNhiemController {
    private static final Logger logger = LoggerFactory.getLogger(ChuNhiemController.class);
    private final ChuNhiemService chuNhiemService;

    public ChuNhiemController(ChuNhiemService chuNhiemService) {
        this.chuNhiemService = chuNhiemService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChuNhiemDTO>>> getAll() {
        try {
            return ResponseEntity.ok(ApiResponse.ok(chuNhiemService.getAll()));
        } catch (Exception ex) {
            logger.error("Lỗi khi lấy danh sách chủ nhiệm", ex);
            return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
        }
    }

    @GetMapping("/giaovien/{giaoVienId}")
        public ResponseEntity<ApiResponse<ChuNhiemDTO>> getByGiaoVien(
            @PathVariable("giaoVienId") Long giaoVienId
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
            @PathVariable("giaoVienId") Long giaoVienId,
            @RequestBody ChuNhiemUpdateRequest request
    ) {
        ChuNhiemDTO result = chuNhiemService.assignByGiaoVienId(giaoVienId, request.getLopId());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/giaovien/{giaoVienId}")
    public ResponseEntity<ApiResponse<Object>> clearByGiaoVien(
            @PathVariable("giaoVienId") Long giaoVienId
    ) {
        chuNhiemService.clearByGiaoVienId(giaoVienId);
        return ResponseEntity.ok(ApiResponse.ok("Đã bỏ phân công chủ nhiệm", null));
    }
}
