package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.HocBaDTO;
import com.hethongtruongthpt.dto.HocBaTinhLopRequest;
import com.hethongtruongthpt.dto.HocBaTinhRequest;
import com.hethongtruongthpt.entity.HocBa;
import com.hethongtruongthpt.service.HocBaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hocba")
@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
public class HocBaController {
    private final HocBaService hocBaService;

    public HocBaController(HocBaService hocBaService) {
        this.hocBaService = hocBaService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll(
            @RequestParam(required = false) Integer hocSinhId,
            @RequestParam(required = false) Integer namHocId,
            @RequestParam(required = false) Integer lopId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        if (hocSinhId != null) {
            return ResponseEntity.ok(ApiResponse.ok(hocBaService.getByHocSinhId(hocSinhId)));
        }
        if (page != null && size != null) {
            Page<HocBa> result = hocBaService.getAllPaged(page, size);
            return ResponseEntity.ok(ApiResponse.ok(result));
        }
        return ResponseEntity.ok(ApiResponse.ok(hocBaService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HocBa>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(hocBaService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HocBa>> create(@Valid @RequestBody HocBa hocBa) {
        return ResponseEntity.ok(ApiResponse.ok(hocBaService.create(hocBa)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HocBa>> update(@PathVariable Integer id, @Valid @RequestBody HocBa hocBa) {
        return ResponseEntity.ok(ApiResponse.ok(hocBaService.update(id, hocBa)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
        hocBaService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa học bạ thành công", null));
    }

    /**
     * Tính học lực cho 1 học sinh theo Thông tư 22.
     */
    @PostMapping("/tinh")
    public ResponseEntity<ApiResponse<HocBaDTO>> tinhHocLuc(@Valid @RequestBody HocBaTinhRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(hocBaService.tinhHocLuc(body.getHocSinhId(), body.getNamHocId())));
    }

    /**
     * Tính học lực cho cả lớp.
     */
    @PostMapping("/tinh-lop")
    public ResponseEntity<ApiResponse<List<HocBaDTO>>> tinhHocLucLop(@Valid @RequestBody HocBaTinhLopRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(hocBaService.tinhHocLucLop(body.getLopId(), body.getNamHocId())));
    }
}
