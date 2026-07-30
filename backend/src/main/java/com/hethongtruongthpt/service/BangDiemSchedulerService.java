package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.*;
import com.hethongtruongthpt.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service xử lý logic gửi bảng điểm tự động cho phụ huynh.
 *
 * Thiết kế:
 * - Mỗi học sinh là 1 transaction độc lập → lỗi 1 HS không block cả batch.
 * - Dùng bảng diem_gui_log để tracking, không sửa bảng diem gốc.
 * - Chỉ gửi điểm LOCKED chưa được gửi trong kỳ (idempotent).
 */
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class BangDiemSchedulerService {
    private static final Logger log = LoggerFactory.getLogger(BangDiemSchedulerService.class);

    private final DiemRepository diemRepository;
    private final DiemGuiLogRepository diemGuiLogRepository;
    private final PhuHuynhHocSinhRepository phuHuynhHocSinhRepository;
    private final ThongBaoRepository thongBaoRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final TransactionTemplate transactionTemplate;

    public BangDiemSchedulerService(
            DiemRepository diemRepository,
            DiemGuiLogRepository diemGuiLogRepository,
            PhuHuynhHocSinhRepository phuHuynhHocSinhRepository,
            ThongBaoRepository thongBaoRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate,
            TransactionTemplate transactionTemplate) {
        this.diemRepository = diemRepository;
        this.diemGuiLogRepository = diemGuiLogRepository;
        this.phuHuynhHocSinhRepository = phuHuynhHocSinhRepository;
        this.thongBaoRepository = thongBaoRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.transactionTemplate = transactionTemplate;
    }


    /**
     * Điểm vào chính — được gọi bởi Scheduler hoặc API test.
     *
     * @param namHoc Năm học chứa kỳ cần gửi
     * @param hocKy Kỳ gửi (1 hoặc 2)
     * @return Tóm tắt kết quả: số học sinh đã gửi, số điểm đã gửi
     */
    public Map<String, Object> guiBangDiemHocKy(NamHoc namHoc, Integer hocKy) {
        String kyGui = namHoc.getId() + "_HK" + hocKy;
        log.info("[BangDiem] Bắt đầu gửi bảng điểm: Năm học {}, Học kỳ {}", namHoc.getTenNamHoc(), hocKy);

        // 1. Lấy tập ID điểm đã gửi trong kỳ này (để lọc nhanh)
        Set<Integer> sentIds = diemGuiLogRepository.findSentDiemIdsByKyGui(kyGui);

        // 2. Lấy tất cả điểm của kỳ hiện tại chưa gửi
        List<Diem> diemChuaGui;
        if (sentIds.isEmpty()) {
            diemChuaGui = diemRepository.findAllDiemByHocKyAndNamHoc(hocKy, namHoc.getTenNamHoc());
        } else {
            diemChuaGui = diemRepository.findDiemChuaGuiByHocKyAndNamHoc(hocKy, namHoc.getTenNamHoc(), sentIds);
        }

        if (diemChuaGui.isEmpty()) {
            log.info("[BangDiem] Không có điểm mới cần gửi trong kỳ {}.", kyGui);
            return Map.of("kyGui", kyGui, "soHocSinh", 0, "soDiem", 0, "message", "Không có điểm mới");
        }

        log.info("[BangDiem] Tìm thấy {} điểm chưa gửi trong kỳ {}.", diemChuaGui.size(), kyGui);


        // 3. Nhóm điểm theo học sinh
        Map<Integer, List<Diem>> diemTheoHocSinh = diemChuaGui.stream()
                .collect(Collectors.groupingBy(d -> d.getHocSinh().getId()));

        int soHocSinhDaGui = 0;
        int soDiemDaGui = 0;

        // 4. Xử lý từng học sinh — mỗi HS là 1 transaction riêng
        for (Map.Entry<Integer, List<Diem>> entry : diemTheoHocSinh.entrySet()) {
            Integer hocSinhId = entry.getKey();
            List<Diem> diemCuaHs = entry.getValue();
            try {
                int result = transactionTemplate.execute(status -> {
                    return xuLyGuiChoHocSinh(hocSinhId, diemCuaHs, kyGui);
                });
                if (result > 0) {
                    soHocSinhDaGui++;
                    soDiemDaGui += result;
                }
            } catch (Exception e) {
                log.error("[BangDiem] Lỗi khi gửi cho học sinh ID={}: {}", hocSinhId, e.getMessage(), e);
                // Tiếp tục với học sinh khác, không throw
            }
        }

        log.info("[BangDiem] Hoàn tất kỳ {}. Đã gửi cho {} học sinh, {} điểm.",
                kyGui, soHocSinhDaGui, soDiemDaGui);

        return Map.of(
                "kyGui", kyGui,
                "soHocSinh", soHocSinhDaGui,
                "soDiem", soDiemDaGui,
                "message", "Gửi thành công"
        );
    }

    /**
     * Xử lý gửi bảng điểm cho 1 học sinh — chạy trong transaction riêng.
     * Nếu HS chưa có phụ huynh liên hệ chính → bỏ qua.
     *
     * @return Số điểm đã gửi (0 nếu bỏ qua)
     */
    @Transactional
    public int xuLyGuiChoHocSinh(Integer hocSinhId, List<Diem> diemList, String kyGui) {
        // Tìm phụ huynh liên hệ chính
        List<PhuHuynhHocSinh> lienKets = phuHuynhHocSinhRepository
                .findByHocSinhIdAndLaNguoiLienHeChinhTrue(hocSinhId);

        if (lienKets.isEmpty()) {
            log.warn("[BangDiem] Học sinh ID={} không có phụ huynh liên hệ chính. Bỏ qua.", hocSinhId);
            return 0;
        }

        PhuHuynhHocSinh lienKet = lienKets.get(0);
        PhuHuynh phuHuynh = lienKet.getPhuHuynh();
        HocSinh hocSinh = diemList.get(0).getHocSinh();

        // Nhóm điểm theo môn học
        Map<String, List<Diem>> diemTheoMon = diemList.stream()
                .collect(Collectors.groupingBy(d -> d.getMonHoc().getTenMon()));

        // Sinh nội dung tin nhắn
        String noiDung = buildNoiDungBangDiem(hocSinh, diemTheoMon, kyGui);
        String tieuDe = "[SLL] Thông báo bảng điểm " + formatKyGui(kyGui);

        // Lưu ThongBao vào box chat (nguoiTao = null → hệ thống tự động)
        ThongBao thongBao = new ThongBao();
        thongBao.setTieuDe(tieuDe);
        thongBao.setNoiDung(noiDung);
        thongBao.setLoai("PHU_HUYNH");
        thongBao.setHocSinh(hocSinh);
        thongBao.setSenderRole("ADMIN");
        // recipientId = userId của phụ huynh để hiển thị đúng trong box chat
        if (phuHuynh.getUser() != null) {
            thongBao.setRecipientId(phuHuynh.getUser().getId());
        }
        // Lấy admin user để làm người tạo (tránh lỗi constraint NOT NULL trên thong_bao)
        User adminUser = userRepository.findByUsername("admin").orElse(null);
        thongBao.setNguoiTao(adminUser);
        thongBao.setIsReply(false);

        ThongBao saved = thongBaoRepository.save(thongBao);
        
        // Broadcast thông báo
        messagingTemplate.convertAndSend("/topic/chat/" + hocSinhId, saved);
        if (saved.getRecipientId() != null) {
            messagingTemplate.convertAndSend("/topic/user/" + saved.getRecipientId(), saved);
        }

        // Lưu DiemGuiLog cho từng điểm
        LocalDateTime now = LocalDateTime.now();
        List<DiemGuiLog> logEntries = new ArrayList<>();
        for (Diem d : diemList) {
            DiemGuiLog logEntry = new DiemGuiLog();
            logEntry.setDiemId(d.getId());
            logEntry.setHocSinhId(hocSinhId);
            logEntry.setPhuHuynhId(phuHuynh.getId());
            logEntry.setThongBaoId(saved.getId());
            logEntry.setNgayGui(now);
            logEntry.setKyGui(kyGui);
            logEntries.add(logEntry);
        }
        diemGuiLogRepository.saveAll(logEntries);

        log.info("[BangDiem] Đã gửi {} điểm cho HS={} → PH={}", diemList.size(), hocSinhId, phuHuynh.getId());
        return diemList.size();
    }

    /**
     * Sinh nội dung tin nhắn bảng điểm.
     */
    private String buildNoiDungBangDiem(HocSinh hocSinh,
                                         Map<String, List<Diem>> diemTheoMon,
                                         String kyGui) {
        String tenLop = (hocSinh.getLop() != null) ? hocSinh.getLop().getTenLop() : "Chưa xếp lớp";
        String ngayGui = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        StringBuilder sb = new StringBuilder();
        sb.append("📚 THÔNG BÁO BẢNG ĐIỂM\n\n");
        sb.append("Kính gửi Quý phụ huynh,\n\n");
        sb.append("Hệ thống EduManager xin thông báo các điểm số mới được cập nhật của em:\n\n");
        sb.append("Họ tên: ").append(hocSinh.getHoTen()).append("\n");
        sb.append("Lớp: ").append(tenLop).append("\n");
        sb.append("Ngày gửi: ").append(ngayGui).append("\n");

        // Sắp xếp môn theo tên để hiển thị nhất quán
        List<String> danhSachMon = new ArrayList<>(diemTheoMon.keySet());
        Collections.sort(danhSachMon);

        for (String tenMon : danhSachMon) {
            List<Diem> danhSachDiem = diemTheoMon.get(tenMon);
            sb.append("\n=========================\n");
            sb.append("MÔN ").append(tenMon.toUpperCase()).append("\n");

            // Sắp xếp điểm: TX1, TX2, TX3, TX4, GK, CK
            danhSachDiem.sort(Comparator
                    .comparing(Diem::getLoaiDiem)
                    .thenComparingInt(d -> d.getSoThuTu() != null ? d.getSoThuTu() : 0));

            for (Diem d : danhSachDiem) {
                String tenLoai = formatLoaiDiem(d.getLoaiDiem(), d.getSoThuTu());
                
                String nhanXet = d.getNhanXet();
                if ("DAT".equalsIgnoreCase(nhanXet)) nhanXet = "ĐẠT";
                else if ("CHUA_DAT".equalsIgnoreCase(nhanXet) || "KDAT".equalsIgnoreCase(nhanXet)) nhanXet = "CHƯA ĐẠT";

                String giaTriStr = (d.getGiaTriDiem() != null)
                        ? d.getGiaTriDiem().stripTrailingZeros().toPlainString()
                        : (nhanXet != null ? nhanXet : "—");
                sb.append("  • ").append(tenLoai).append(": ").append(giaTriStr).append("\n");
            }
        }

        sb.append("\n=========================\n\n");
        sb.append("Quý phụ huynh vui lòng đăng nhập hệ thống để xem đầy đủ bảng điểm và nhận xét của giáo viên.\n\n");
        sb.append("Trân trọng!");

        return sb.toString();
    }

    /** Định dạng tên loại điểm: TX1 → "TX1", GK → "Giữa kỳ", CK → "Cuối kỳ" */
    private String formatLoaiDiem(String loaiDiem, Integer soThuTu) {
        if (loaiDiem == null) return "Không xác định";
        return switch (loaiDiem.toUpperCase()) {
            case "TX" -> "TX" + (soThuTu != null && soThuTu > 0 ? soThuTu : "");
            case "GK" -> "Giữa kỳ";
            case "CK" -> "Cuối kỳ";
            default -> loaiDiem;
        };
    }

    /** Chuyển "1_HK1" → "Học kỳ 1 năm học 2023-2024" (nếu có thông tin) */
    private String formatKyGui(String kyGui) {
        if (kyGui != null && kyGui.contains("_HK")) {
            String[] parts = kyGui.split("_HK");
            if (parts.length == 2) {
                return "Học kỳ " + parts[1];
            }
        }
        return kyGui;
    }
}
