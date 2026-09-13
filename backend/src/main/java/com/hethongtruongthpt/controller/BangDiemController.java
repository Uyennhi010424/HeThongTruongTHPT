package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.repository.DiemGuiLogRepository;
import com.hethongtruongthpt.repository.DiemRepository;
import com.hethongtruongthpt.repository.NamHocRepository;
import com.hethongtruongthpt.service.BangDiemSchedulerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

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
    private final NamHocRepository namHocRepository;
    private final DiemRepository diemRepository;
    private final DiemGuiLogRepository diemGuiLogRepository;

    public BangDiemController(BangDiemSchedulerService bangDiemSchedulerService,
                              NamHocRepository namHocRepository,
                              DiemRepository diemRepository,
                              DiemGuiLogRepository diemGuiLogRepository) {
        this.bangDiemSchedulerService = bangDiemSchedulerService;
        this.namHocRepository = namHocRepository;
        this.diemRepository = diemRepository;
        this.diemGuiLogRepository = diemGuiLogRepository;
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

        List<NamHoc> activeYears = namHocRepository.findByTrangThai("DANG_MO");
        if (activeYears.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Không tìm thấy năm học nào đang mở."));
        }
        NamHoc activeNamHoc = activeYears.get(0);

        // Kiểm tra xem đã có dữ liệu điểm nào trong học kỳ này chưa
        List<Diem> allDiem = diemRepository.findAllDiemByHocKyAndNamHoc(hocKy, activeNamHoc.getTenNamHoc());
        if (allDiem == null || allDiem.isEmpty()) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Chưa có dữ liệu điểm nào trong Học kỳ " + hocKy + " (" + activeNamHoc.getTenNamHoc() + ") để gửi cho phụ huynh.")
            );
        }

        String kyGui = activeNamHoc.getId() + "_HK" + hocKy;
        Set<Integer> sentIds = diemGuiLogRepository.findSentDiemIdsByKyGui(kyGui);
        List<Diem> diemChuaGui = (sentIds == null || sentIds.isEmpty())
                ? allDiem
                : diemRepository.findDiemChuaGuiByHocKyAndNamHoc(hocKy, activeNamHoc.getTenNamHoc(), sentIds);

        if (diemChuaGui == null || diemChuaGui.isEmpty()) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Tất cả điểm trong Học kỳ " + hocKy + " (" + activeNamHoc.getTenNamHoc() + ") đã được gửi trước đó, không có điểm mới cần gửi.")
            );
        }

        // Chạy không đồng bộ để tránh timeout trình duyệt do duyệt số lượng điểm lớn
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            bangDiemSchedulerService.guiBangDiemHocKy(activeNamHoc, hocKy);
        });

        String msg = "Hệ thống đang tiến hành quét và gửi " + diemChuaGui.size() + " điểm của Học kỳ " + hocKy + " cho phụ huynh.";
        return ResponseEntity.ok(ApiResponse.ok(msg, null));
    }
}
