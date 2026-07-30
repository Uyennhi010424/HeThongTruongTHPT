package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.service.BangDiemSchedulerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


/**
 * Controller cung cấp API quản lý chức năng gửi bảng điểm tự động.
 *
 * Endpoints:
 *   POST /api/bang-diem/gui-thu-cong        → Trigger gửi thủ công (ADMIN only) — để test
 *   GET  /api/bang-diem/kiem-tra-ky/{kyGui} → Xem điểm đã gửi trong kỳ
 */
@RestController
@RequestMapping("/api/bang-diem")
public class BangDiemController {

    private final BangDiemSchedulerService bangDiemSchedulerService;
    private final com.hethongtruongthpt.repository.NamHocRepository namHocRepository;

    public BangDiemController(BangDiemSchedulerService bangDiemSchedulerService,
                              com.hethongtruongthpt.repository.NamHocRepository namHocRepository) {
        this.bangDiemSchedulerService = bangDiemSchedulerService;
        this.namHocRepository = namHocRepository;
    }

    /**
     * Trigger gửi bảng điểm thủ công — dành cho Admin test.
     *
     * POST /api/bang-diem/gui-thu-cong
     * Body (tùy chọn): { "hocKy": 1 }
     *
     * @return Thông báo đã nhận lệnh
     */
    @PostMapping("/gui-thu-cong")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Object>> guiThuCong(
            @RequestBody(required = false) Map<String, Object> body) {

        Integer hocKy = (body != null && body.containsKey("hocKy") && body.get("hocKy") != null)
                ? Integer.parseInt(body.get("hocKy").toString())
                : 1;

        if (hocKy != 1 && hocKy != 2) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Học kỳ không hợp lệ (chỉ nhận 1 hoặc 2)"));
        }

        java.util.List<com.hethongtruongthpt.entity.NamHoc> activeYears = namHocRepository.findByTrangThai("DANG_MO");
        if (activeYears.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Không tìm thấy năm học nào đang mở."));
        }
        com.hethongtruongthpt.entity.NamHoc activeNamHoc = activeYears.get(0);

        // Chạy không đồng bộ để tránh timeout trình duyệt do duyệt số lượng điểm lớn
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            bangDiemSchedulerService.guiBangDiemHocKy(activeNamHoc, hocKy);
        });

        String msg = "Hệ thống đang tiến hành quét và gửi điểm Học kỳ " + hocKy + " ngầm. Quá trình này có thể mất vài phút tùy số lượng điểm.";
        return ResponseEntity.ok(ApiResponse.ok(msg, null));
    }
}
