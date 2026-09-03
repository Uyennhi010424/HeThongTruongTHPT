package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.phancong.PhanCongDayDTO;
import com.hethongtruongthpt.service.PhanCongDayService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/phancong-day")
@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
public class PhanCongDayController {
    private final PhanCongDayService service;

    public PhanCongDayController(PhanCongDayService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PhanCongDayDTO>>> getAll(
            @RequestParam(required = false) String namHoc,
            @RequestParam(required = false) Integer hocKy,
            @RequestParam(required = false) Integer lopId
    ) {
        if (lopId != null && namHoc != null && hocKy != null) {
            return ResponseEntity.ok(ApiResponse.ok(service.getByLopIdAndNamHocAndHocKy(lopId, namHoc, hocKy)));
        }
        if (lopId != null) {
            return ResponseEntity.ok(ApiResponse.ok(service.getByLopId(lopId)));
        }
        if (namHoc != null && hocKy != null) {
            return ResponseEntity.ok(ApiResponse.ok(service.getByNamHocAndHocKy(namHoc, hocKy)));
        }

        return ResponseEntity.ok(ApiResponse.ok(service.getAll()));
    }

    @org.springframework.web.bind.annotation.PostMapping
    public ResponseEntity<ApiResponse<PhanCongDayDTO>> create(@org.springframework.web.bind.annotation.RequestBody PhanCongDayDTO dto) {
        PhanCongDayDTO created = service.create(dto);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteById(@PathVariable Integer id) {
        service.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Long>> deleteByNamHocAndHocKy(
            @RequestParam String namHoc,
            @RequestParam Integer hocKy
    ) {
        long deleted = service.deleteByNamHocAndHocKy(namHoc, hocKy);
        return ResponseEntity.ok(ApiResponse.ok(deleted));
    }

    @org.springframework.web.bind.annotation.PostMapping("/delete")
    public ResponseEntity<ApiResponse<Long>> deleteByNamHocAndHocKyPost(
            @RequestParam String namHoc,
            @RequestParam Integer hocKy
    ) {
        long deleted = service.deleteByNamHocAndHocKy(namHoc, hocKy);
        return ResponseEntity.ok(ApiResponse.ok(deleted));
    }

    @org.springframework.web.bind.annotation.PostMapping("/auto-assign")
    public ResponseEntity<ApiResponse<List<PhanCongDayDTO>>> autoAssign(
            @RequestParam String namHoc,
            @RequestParam Integer hocKy
    ) {
        List<PhanCongDayDTO> created = service.autoAssignAllSubjects(namHoc, hocKy);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }

    @org.springframework.web.bind.annotation.PostMapping("/sync-hk2")
    public ResponseEntity<ApiResponse<Object>> syncHk2(
            @RequestParam(required = false, defaultValue = "2025-2026") String namHoc
    ) {
        service.syncHocKy2FromHocKy1(namHoc);
        return ResponseEntity.ok(ApiResponse.ok("Đã đồng bộ phân công HK2 theo HK1 thành công", null));
    }
}
