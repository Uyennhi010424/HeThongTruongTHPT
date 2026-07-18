package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.entity.PhuHuynhHocSinh;
import com.hethongtruongthpt.entity.ThongBao;
import com.hethongtruongthpt.repository.PhuHuynhHocSinhRepository;
import com.hethongtruongthpt.repository.SmsLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final ThongBaoService thongBaoService;
    private final SmsLogRepository smsLogRepository;
    private final PhuHuynhHocSinhRepository phuHuynhHocSinhRepository;
    private final SmsService smsService;

    public NotificationService(ThongBaoService thongBaoService,
                               SmsLogRepository smsLogRepository,
                               PhuHuynhHocSinhRepository phuHuynhHocSinhRepository,
                               SmsService smsService) {
        this.thongBaoService = thongBaoService;
        this.smsLogRepository = smsLogRepository;
        this.phuHuynhHocSinhRepository = phuHuynhHocSinhRepository;
        this.smsService = smsService;
    }

    /**
     * Tao thong bao va gui SMS cho phu huynh (neu can).
     *
     * @param thongBao thong bao can tao
     * @param sendSms  co gui SMS cho phu huynh hay khong
     * @return thong bao da luu
     */
    public ThongBao createThongBaoWithSms(ThongBao thongBao, boolean sendSms) {
        ThongBao saved = thongBaoService.create(thongBao);

        if (sendSms && shouldSendSms(thongBao.getLoai())) {
            sendSmsToParentsAsync(thongBao);
        }

        return saved;
    }

    private boolean shouldSendSms(String loai) {
        return "PHU_HUYNH".equals(loai) || "ALL".equals(loai);
    }

    @Async
    public void sendSmsToParentsAsync(ThongBao thongBao) {
        try {
            List<PhuHuynhHocSinh> allLinks = phuHuynhHocSinhRepository.findAll();

            Set<Integer> processedParentIds = new HashSet<>();
            int sentCount = 0;

            String noiDung = String.format("[THÔNG BÁO] %s: %s",
                    thongBao.getTieuDe(),
                    thongBao.getNoiDung().length() > 100
                            ? thongBao.getNoiDung().substring(0, 100) + "..."
                            : thongBao.getNoiDung());

            for (PhuHuynhHocSinh link : allLinks) {
                PhuHuynh phuHuynh = link.getPhuHuynh();
                if (phuHuynh == null) continue;

                Integer parentId = phuHuynh.getId();
                if (processedParentIds.contains(parentId)) continue;
                processedParentIds.add(parentId);

                if (!Boolean.TRUE.equals(phuHuynh.getIsSmSActive())) continue;

                String soDienThoai = phuHuynh.getSoDienThoai();
                if (soDienThoai == null || soDienThoai.isBlank()) continue;

                Integer hocSinhId = link.getHocSinh() != null ? link.getHocSinh().getId() : null;
                if (hocSinhId == null) continue;

                // Kiem tra gioi han SMS thang
                String thangNam = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
                long smsCount = smsLogRepository.countByHocSinhIdAndThangNam(hocSinhId, thangNam);
                if (smsCount >= 30) {
                    log.warn("Đã đạt giới hạn SMS tháng cho phụ huynh {}", parentId);
                    continue;
                }

                // Gui SMS thuc te qua ESMS API
                SmsService.SmsResult result = smsService.sendSimpleSms(soDienThoai, noiDung, hocSinhId);
                if (result.isSuccess()) {
                    sentCount++;
                    log.info("Đã gửi SMS cho phụ huynh {} ({})", phuHuynh.getHoTen(), soDienThoai);
                } else {
                    log.warn("Gửi SMS thất bại cho phụ huynh {}: {}", phuHuynh.getHoTen(), result.getMessage());
                }
            }

            log.info("Hoàn tất gửi SMS thông báo cho {}/{} phụ huynh", sentCount, processedParentIds.size());
        } catch (Exception e) {
            log.error("Lỗi khi gửi SMS thông báo: {}", e.getMessage(), e);
        }
    }
}
