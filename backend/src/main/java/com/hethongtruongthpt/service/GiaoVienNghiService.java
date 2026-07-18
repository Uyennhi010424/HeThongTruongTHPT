package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.GiaoVienNghi;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.GiaoVienNghiRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class GiaoVienNghiService {

    private static final Logger logger = LoggerFactory.getLogger(GiaoVienNghiService.class);

    private final GiaoVienNghiRepository nghiRepo;
    private final GiaoVienRepository gvRepo;

    public GiaoVienNghiService(GiaoVienNghiRepository nghiRepo, GiaoVienRepository gvRepo) {
        this.nghiRepo = nghiRepo;
        this.gvRepo = gvRepo;
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
    public List<GiaoVienNghi> getByGiaoVienAndRange(Integer giaoVienId, LocalDate from, LocalDate to) {
        if (giaoVienId == null) throw new ApiException("Thiếu giáo viên");
        if (from != null && to != null) {
            return nghiRepo.findByGiaoVienIdAndNgayBetween(giaoVienId, from, to);
        }
        return nghiRepo.findByGiaoVienId(giaoVienId);
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

        // Allow registering if there is no pending/approved record for this teacher on this day
        java.util.Optional<GiaoVienNghi> existing = nghiRepo.findByGiaoVienIdAndNgay(giaoVienId, ngay);
        if (existing.isPresent()) {
            GiaoVienNghi old = existing.get();
            if ("APPROVED".equals(old.getTrangThai()) || "PENDING".equals(old.getTrangThai())) {
                throw new ApiException("Yêu cầu nghỉ ngày " + ngay + " đã tồn tại hoặc đã được duyệt.");
            }
            // If REJECTED, we can reuse or delete old to re-submit
            nghiRepo.delete(old);
            nghiRepo.flush();
        }

        GiaoVienNghi nghi = new GiaoVienNghi();
        nghi.setGiaoVien(gv);
        nghi.setNgay(ngay);
        nghi.setNamHoc(namHoc);
        nghi.setLyDo(lyDo);
        nghi.setGhiChu(ghiChu);
        nghi.setTrangThai("PENDING"); // Default status

        GiaoVienNghi saved = nghiRepo.save(nghi);
        logger.info("Giao vien {} dang ky nghi ngay {} (Trang thai: PENDING)", gv.getHoTen(), ngay);
        return saved;
    }

    @Transactional
    public GiaoVienNghi duyetNghi(Integer id, String trangThai, String lyDoTuChoi, Integer giaoVienThayId) {
        if (id == null || trangThai == null) throw new ApiException("Thiếu mã đơn nghỉ hoặc trạng thái duyệt");
        
        GiaoVienNghi nghi = nghiRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn xin nghỉ"));

        if (!"APPROVED".equals(trangThai) && !"REJECTED".equals(trangThai)) {
            throw new ApiException("Trạng thái phê duyệt không hợp lệ");
        }

        nghi.setTrangThai(trangThai);
        if ("REJECTED".equals(trangThai)) {
            nghi.setLyDoTuChoi(lyDoTuChoi);
            nghi.setGiaoVienThay(null);
            logger.info("Admin tu choi don nghi cua GV {} ngay {} vi: {}", nghi.getGiaoVien().getHoTen(), nghi.getNgay(), lyDoTuChoi);
        } else {
            nghi.setLyDoTuChoi(null);
            if (giaoVienThayId != null) {
                GiaoVien thay = gvRepo.findById(giaoVienThayId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên thay thế"));
                nghi.setGiaoVienThay(thay);
                logger.info("Admin duyet don nghi cua GV {} va phan cong GV {} day thay ngay {}", 
                    nghi.getGiaoVien().getHoTen(), thay.getHoTen(), nghi.getNgay());
            } else {
                nghi.setGiaoVienThay(null);
                logger.info("Admin duyet don nghi cua GV {} ngay {} (Khong phan cong GV thay)", nghi.getGiaoVien().getHoTen(), nghi.getNgay());
            }
        }

        return nghiRepo.save(nghi);
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
