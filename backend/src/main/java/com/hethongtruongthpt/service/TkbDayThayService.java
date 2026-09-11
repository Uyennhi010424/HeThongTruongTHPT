package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import com.hethongtruongthpt.entity.TkbDayThay;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.ThoiKhoaBieuRepository;
import com.hethongtruongthpt.repository.TkbDayThayRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class TkbDayThayService {

    private static final Logger logger = LoggerFactory.getLogger(TkbDayThayService.class);
    private static final java.time.format.DateTimeFormatter DATE_FMT = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final TkbDayThayRepository dayThayRepo;
    private final ThoiKhoaBieuRepository tkbRepo;
    private final GiaoVienRepository gvRepo;
    private final LeaveNotificationService notificationService;

    public TkbDayThayService(TkbDayThayRepository dayThayRepo,
                              ThoiKhoaBieuRepository tkbRepo,
                              GiaoVienRepository gvRepo,
                              LeaveNotificationService notificationService) {
        this.dayThayRepo = dayThayRepo;
        this.tkbRepo = tkbRepo;
        this.gvRepo = gvRepo;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<TkbDayThay> getByNgayAndNamHoc(LocalDate ngay, String namHoc) {
        if (ngay == null) throw new ApiException("Thiếu ngày");
        if (namHoc != null && !namHoc.isBlank()) {
            return dayThayRepo.findByNgayAndNamHoc(ngay, namHoc);
        }
        return dayThayRepo.findByNgay(ngay);
    }

    @Transactional(readOnly = true)
    public List<TkbDayThay> getByTkbId(Integer tkbId) {
        if (tkbId == null) throw new ApiException("Thiếu TKB ID");
        return dayThayRepo.findByThoiKhoaBieuId(tkbId);
    }

    @Transactional(readOnly = true)
    public List<TkbDayThay> getByRangeAndNamHoc(LocalDate from, LocalDate to, String namHoc) {
        if (from == null || to == null) throw new ApiException("Thiếu khoảng ngày");
        if (namHoc != null && !namHoc.isBlank()) {
            return dayThayRepo.findByNgayBetweenAndNamHoc(from, to, namHoc);
        }
        return dayThayRepo.findByNgayBetween(from, to);
    }

    @Transactional(readOnly = true)
    public List<TkbDayThay> getAll(String namHoc) {
        if (namHoc != null && !namHoc.isBlank()) {
            return dayThayRepo.findByNamHoc(namHoc);
        }
        return dayThayRepo.findAll();
    }

    @Transactional(readOnly = true)
    public List<TkbDayThay> getAll() {
        return getAll(null);
    }

    @Transactional
    public TkbDayThay phanCongDayThay(Integer tkbId, Integer giaoVienThayId, LocalDate ngay, String ghiChu) {
        if (tkbId == null || giaoVienThayId == null || ngay == null)
            throw new ApiException("Thiếu TKB, giáo viên thay, hoặc ngày");

        ThoiKhoaBieu tkb = tkbRepo.findById(tkbId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thời khóa biểu"));

        GiaoVien gvThay = gvRepo.findById(giaoVienThayId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên thay"));

        // Kiem tra giao vien thay co bi trung lich khong
        validateNoConflict(tkb, giaoVienThayId, ngay);

        TkbDayThay dayThay = new TkbDayThay();
        dayThay.setThoiKhoaBieu(tkb);
        dayThay.setGiaoVienThay(gvThay);
        dayThay.setNgay(ngay);
        dayThay.setGhiChu(ghiChu);

        TkbDayThay saved = dayThayRepo.save(dayThay);
        logger.info("Phan cong day thay: {} -> {} ngay {} thu {} tiet {}",
            tkb.getGiaoVien().getHoTen(), gvThay.getHoTen(), ngay, tkb.getThu(), tkb.getTietBatDau());

        // Gui thong bao den giao vien duoc phan cong day thay
        if (gvThay.getUser() != null) {
            String tenMon = tkb.getMonHoc() != null ? tkb.getMonHoc().getTenMon() : "môn học";
            String tenLop = tkb.getLop() != null ? tkb.getLop().getTenLop() : "lớp";
            String gvGoc = tkb.getGiaoVien() != null ? tkb.getGiaoVien().getHoTen() : "đồng nghiệp";
            String msg = "Bạn được phân công dạy thay môn " + tenMon + " lớp " + tenLop 
                + " (Tiết " + tkb.getTietBatDau() + ", Thứ " + tkb.getThu() + ") ngày " + ngay.format(DATE_FMT) 
                + " thay cho GV " + gvGoc
                + (ghiChu != null && !ghiChu.isBlank() ? " - Ghi chú: " + ghiChu : "") + ".";
            notificationService.sendToUser(
                gvThay.getUser(),
                "Phân công dạy thay",
                msg,
                "SUBSTITUTE_TEACHING",
                saved.getId()
            );
        }

        return saved;
    }

    @SuppressWarnings("null")
    @Transactional
    public void huyDayThay(Integer id) {
        if (id == null) throw new ApiException("Thiếu ID");
        TkbDayThay dayThay = dayThayRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phân công dạy thay"));
        dayThayRepo.delete(dayThay);
        logger.info("Huy day thay ID {}", id);
    }

    /**
     * Kiem tra giao vien thay co bi trung lich vao ngay do hay khong.
     * Check 2 nguon: TKB chinh thuc va cac day thay khac cung ngay.
     */
    private void validateNoConflict(ThoiKhoaBieu tkb, Integer giaoVienThayId, LocalDate ngay) {
        // Chuyen ngay -> thu trong tuan (2=Mon..7=Sat)
        int thu = ngay.getDayOfWeek().getValue() + 1; // MONDAY=1 -> 2
        if (thu < 2 || thu > 7) {
            throw new ApiException("Ngày không phải ngày học trong tuần");
        }

        int tietBatDau = tkb.getTietBatDau();
        int soTiet = tkb.getSoTiet();

        // Check trung voi TKB chinh thuc cua giao vien thay
        List<ThoiKhoaBieu> tkbCuaGvThay = tkbRepo.findByGiaoVienId(giaoVienThayId);
        for (ThoiKhoaBieu existing : tkbCuaGvThay) {
            if (existing.getThu() != thu) continue;
            if (!isSameWeek(existing, ngay)) continue;
            if (isOverlap(tietBatDau, soTiet, existing.getTietBatDau(), existing.getSoTiet())) {
                throw new ApiException("Giáo viên thay đã có lịch dạy " +
                    existing.getMonHoc().getTenMon() + " lớp " +
                    existing.getLop().getTenLop() + " vào tiết " +
                    existing.getTietBatDau() + " thứ " + existing.getThu());
            }
        }

        // Check trung voi cac day thay khac cung ngay
        List<TkbDayThay> dayThayCungNgay = dayThayRepo.findByNgay(ngay);
        for (TkbDayThay dt : dayThayCungNgay) {
            if (!dt.getGiaoVienThay().getId().equals(giaoVienThayId)) continue;
            ThoiKhoaBieu existingTkb = dt.getThoiKhoaBieu();
            if (existingTkb.getThu() != thu) continue;
            if (isOverlap(tietBatDau, soTiet, existingTkb.getTietBatDau(), existingTkb.getSoTiet())) {
                throw new ApiException("Giáo viên thay đã được phân công dạy thay lớp " +
                    existingTkb.getLop().getTenLop() + " vào tiết " +
                    existingTkb.getTietBatDau() + " cùng ngày");
            }
        }
    }

    private boolean isSameWeek(ThoiKhoaBieu tkb, LocalDate ngay) {
        // So sanh tuan: neu TKB co tuan va ngay co the xac dinh tuan
        // Don gian hoa: check nam hoc va hoc ky
        return true; // Simplified - in production, compare week numbers
    }

    private boolean isOverlap(int start1, int count1, int start2, int count2) {
        int end1 = start1 + count1 - 1;
        int end2 = start2 + count2 - 1;
        return start1 <= end2 && start2 <= end1;
    }
}
