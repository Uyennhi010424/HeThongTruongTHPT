package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.GiaoVienNghi;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.GiaoVienNghiRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class GiaoVienNghiService {

    private static final Logger logger = LoggerFactory.getLogger(GiaoVienNghiService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final GiaoVienNghiRepository nghiRepo;
    private final GiaoVienRepository gvRepo;
    private final LeaveNotificationService notificationService;

    public GiaoVienNghiService(GiaoVienNghiRepository nghiRepo,
                                GiaoVienRepository gvRepo,
                                LeaveNotificationService notificationService) {
        this.nghiRepo = nghiRepo;
        this.gvRepo = gvRepo;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<GiaoVienNghi> getByNgayAndNamHoc(LocalDate ngay, String namHoc) {
        if (ngay == null) throw new ApiException("Thiếu ngày");
        if (namHoc != null && !namHoc.isBlank()) {
            return nghiRepo.findByNgayAndNamHoc(ngay, namHoc);
        }
        return nghiRepo.findByNgay(ngay);
    }

    @Transactional(readOnly = true)
    public List<GiaoVienNghi> getByNamHoc(String namHoc) {
        if (namHoc == null || namHoc.isBlank()) return nghiRepo.findAll();
        return nghiRepo.findByNamHoc(namHoc);
    }

    @Transactional(readOnly = true)
    public List<GiaoVienNghi> getByGiaoVienAndRange(Integer giaoVienId, LocalDate from, LocalDate to, String namHoc) {
        if (giaoVienId == null) throw new ApiException("Thiếu giáo viên");
        if (from != null && to != null) {
            return nghiRepo.findByGiaoVienIdAndNgayBetween(giaoVienId, from, to);
        }
        if (namHoc != null && !namHoc.isBlank()) {
            return nghiRepo.findByGiaoVienIdAndNamHoc(giaoVienId, namHoc);
        }
        return nghiRepo.findByGiaoVienId(giaoVienId);
    }

    @Transactional(readOnly = true)
    public List<GiaoVienNghi> getByGiaoVienAndRange(Integer giaoVienId, LocalDate from, LocalDate to) {
        return getByGiaoVienAndRange(giaoVienId, from, to, null);
    }

    @Transactional(readOnly = true)
    public List<GiaoVienNghi> getAll() {
        return nghiRepo.findAll();
    }

    @Transactional
    public GiaoVienNghi dangKyNghi(Integer giaoVienId, LocalDate ngay, String namHoc, String lyDo, String ghiChu) {
        if (giaoVienId == null || ngay == null) throw new ApiException("Thiếu giáo viên hoặc ngày");
        if (namHoc == null || namHoc.isBlank()) throw new ApiException("Thiếu năm học");

        GiaoVien gv = gvRepo.findById(giaoVienId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên"));

        java.util.Optional<GiaoVienNghi> existing = nghiRepo.findByGiaoVienIdAndNgay(giaoVienId, ngay);
        if (existing.isPresent()) {
            GiaoVienNghi old = existing.get();
            if ("APPROVED".equals(old.getTrangThai()) || "PENDING".equals(old.getTrangThai())) {
                throw new ApiException("Yêu cầu nghỉ ngày " + ngay + " đã tồn tại hoặc đã được duyệt.");
            }
            nghiRepo.delete(old);
            nghiRepo.flush();
        }

        GiaoVienNghi nghi = new GiaoVienNghi();
        nghi.setGiaoVien(gv);
        nghi.setNgay(ngay);
        nghi.setNamHoc(namHoc);
        nghi.setLyDo(lyDo);
        nghi.setGhiChu(ghiChu);
        nghi.setTrangThai("PENDING");

        GiaoVienNghi saved = nghiRepo.save(nghi);
        logger.info("Giao vien {} dang ky nghi ngay {} (Trang thai: PENDING)", gv.getHoTen(), ngay);

        // --- Send notification to all admins ---
        String tenGv = gv.getHoTen() != null ? gv.getHoTen() : "Giáo viên";
        notificationService.sendToAllAdmins(
            "Đơn xin nghỉ mới",
            tenGv + " xin nghỉ ngày " + ngay.format(DATE_FMT),
            "LEAVE_REQUEST",
            saved.getId()
        );

        return saved;
    }

    @Transactional
    public GiaoVienNghi duyetNghi(Integer id, String trangThai, String lyDoTuChoi,
                                   Integer giaoVienThayId, String adminMessage, User approvedByUser) {
        if (id == null || trangThai == null) throw new ApiException("Thiếu mã đơn nghỉ hoặc trạng thái duyệt");

        GiaoVienNghi nghi = nghiRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn xin nghỉ"));

        String normalizedStatus = "DA_DUYET".equalsIgnoreCase(trangThai) ? "APPROVED" :
                                  "TU_CHOI".equalsIgnoreCase(trangThai) ? "REJECTED" : trangThai;

        if (!"APPROVED".equals(normalizedStatus) && !"REJECTED".equals(normalizedStatus)) {
            throw new ApiException("Trạng thái phê duyệt không hợp lệ");
        }

        nghi.setTrangThai(normalizedStatus);
        nghi.setAdminMessage(adminMessage);
        nghi.setApprovedBy(approvedByUser);
        nghi.setApprovedAt(LocalDateTime.now());

        if ("REJECTED".equals(normalizedStatus)) {
            nghi.setLyDoTuChoi(lyDoTuChoi);
            nghi.setGiaoVienThay(null);
            logger.info("Admin tu choi don nghi cua GV {} ngay {}", nghi.getGiaoVien().getHoTen(), nghi.getNgay());
        } else {
            nghi.setLyDoTuChoi(null);
            if (giaoVienThayId != null) {
                GiaoVien thay = gvRepo.findById(giaoVienThayId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên thay thế"));
                nghi.setGiaoVienThay(thay);
            } else {
                nghi.setGiaoVienThay(null);
            }
            logger.info("Admin duyet don nghi cua GV {} ngay {}", nghi.getGiaoVien().getHoTen(), nghi.getNgay());
        }

        GiaoVienNghi saved = nghiRepo.save(nghi);

        // --- Send notification back to the teacher ---
        GiaoVien gv = nghi.getGiaoVien();
        if (gv != null && gv.getUser() != null) {
            User teacherUser = gv.getUser();
            boolean approved = "APPROVED".equals(trangThai);
            String title = approved ? "Đơn xin nghỉ được duyệt" : "Đơn xin nghỉ bị từ chối";
            String msg = approved
                ? "Đơn xin nghỉ ngày " + nghi.getNgay().format(DATE_FMT) + " của bạn đã được chấp thuận."
                : "Đơn xin nghỉ ngày " + nghi.getNgay().format(DATE_FMT) + " của bạn đã bị từ chối."
                    + (lyDoTuChoi != null ? " Lý do: " + lyDoTuChoi : "");
            notificationService.sendToUser(teacherUser, title, msg, "LEAVE_RESULT", saved.getId());
        }

        return saved;
    }

    /** Backward-compatible overload (no adminMessage / approvedBy) */
    @Transactional
    public GiaoVienNghi duyetNghi(Integer id, String trangThai, String lyDoTuChoi, Integer giaoVienThayId) {
        return duyetNghi(id, trangThai, lyDoTuChoi, giaoVienThayId, null, null);
    }

    @SuppressWarnings("null")
    @Transactional
    public void huyNghi(Integer id) {
        if (id == null) throw new ApiException("Thiếu ID");
        GiaoVienNghi nghi = nghiRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đăng ký nghỉ"));
        nghiRepo.delete(nghi);
        logger.info("Huy nghi giao vien {} ngay {}", nghi.getGiaoVien().getHoTen(), nghi.getNgay());
    }

    @Transactional(readOnly = true)
    public boolean isNghi(Integer giaoVienId, LocalDate ngay) {
        return nghiRepo.findByGiaoVienIdAndNgay(giaoVienId, ngay)
            .map(n -> "APPROVED".equals(n.getTrangThai()))
            .orElse(false);
    }
}
