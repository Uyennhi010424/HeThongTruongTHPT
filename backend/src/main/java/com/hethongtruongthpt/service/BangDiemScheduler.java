package com.hethongtruongthpt.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.Map;

/**
 * Scheduler tự động gửi bảng điểm cho phụ huynh vào 00:00 ngày 15 hàng tháng.
 * Không cần Admin thao tác.
 *
 * Cron: "0 0 7 * * *"
 *   - Chạy hàng ngày vào lúc 07:00 sáng.
 *   - Kiểm tra ngày kết thúc học kỳ 1 và học kỳ 2 để quyết định gửi điểm.
 */
@Service
public class BangDiemScheduler {

    private static final Logger log = LoggerFactory.getLogger(BangDiemScheduler.class);

    private final BangDiemSchedulerService bangDiemSchedulerService;

    private final com.hethongtruongthpt.repository.NamHocRepository namHocRepository;

    public BangDiemScheduler(BangDiemSchedulerService bangDiemSchedulerService, 
                             com.hethongtruongthpt.repository.NamHocRepository namHocRepository) {
        this.bangDiemSchedulerService = bangDiemSchedulerService;
        this.namHocRepository = namHocRepository;
    }

    /**
     * Chạy tự động vào 07:00 mỗi ngày.
     */
    @Scheduled(cron = "0 0 7 * * *")
    public void scheduledGuiBangDiem() {
        log.info("[Scheduler] Đang kiểm tra lịch gửi bảng điểm tự động...");
        try {
            java.time.LocalDate today = java.time.LocalDate.now();
            java.util.List<com.hethongtruongthpt.entity.NamHoc> activeYears = namHocRepository.findByTrangThai("DANG_MO");
            
            for (com.hethongtruongthpt.entity.NamHoc namHoc : activeYears) {
                // Kiểm tra Học kỳ 1: Gửi sau 1 ngày kết thúc HK1
                if (today.equals(namHoc.getNgayKetThucHk1().plusDays(1))) {
                    log.info("[Scheduler] Hôm nay là sau 1 ngày kết thúc HK1 của {}. Kích hoạt gửi điểm HK1.", namHoc.getTenNamHoc());
                    bangDiemSchedulerService.guiBangDiemHocKy(namHoc, 1);
                }
                
                // Kiểm tra Học kỳ 2: Gửi sau 1 ngày kết thúc HK2
                if (today.equals(namHoc.getNgayKetThucHk2().plusDays(1))) {
                    log.info("[Scheduler] Hôm nay là sau 1 ngày kết thúc HK2 của {}. Kích hoạt gửi điểm HK2.", namHoc.getTenNamHoc());
                    bangDiemSchedulerService.guiBangDiemHocKy(namHoc, 2);
                }
            }
        } catch (Exception e) {
            log.error("[Scheduler] Lỗi nghiêm trọng khi chạy scheduler gửi bảng điểm: {}", e.getMessage(), e);
        }
    }
}
