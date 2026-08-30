package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.LichThi;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.LichThiRepository;
import com.hethongtruongthpt.dto.AutoGenerateExamRequest;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.MonHocRepository;
import com.hethongtruongthpt.repository.NamHocRepository;
import com.hethongtruongthpt.repository.ThoiKhoaBieuRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.entity.GiaoVien;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class LichThiService {
    private final LichThiRepository lichThiRepository;
    private final LopHocRepository lopHocRepository;
    private final MonHocRepository monHocRepository;
    private final ThoiKhoaBieuRepository thoiKhoaBieuRepository;
    private final NamHocRepository namHocRepository;
    private final GiaoVienRepository giaoVienRepository;

    public LichThiService(LichThiRepository lichThiRepository,
                          LopHocRepository lopHocRepository,
                          MonHocRepository monHocRepository,
                          ThoiKhoaBieuRepository thoiKhoaBieuRepository,
                          NamHocRepository namHocRepository,
                          GiaoVienRepository giaoVienRepository) {
        this.lichThiRepository = lichThiRepository;
        this.lopHocRepository = lopHocRepository;
        this.monHocRepository = monHocRepository;
        this.thoiKhoaBieuRepository = thoiKhoaBieuRepository;
        this.namHocRepository = namHocRepository;
        this.giaoVienRepository = giaoVienRepository;
    }

    public List<LichThi> getAll() {
        return lichThiRepository.findAll();
    }

    public Page<LichThi> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("ngayThi").descending());
        return lichThiRepository.findAll(pageable);
    }

    public List<LichThi> getByLopId(Integer lopId) {
        return lichThiRepository.findByLopId(lopId);
    }

    public List<LichThi> getByNamHocAndHocKy(String namHoc, Integer hocKy) {
        return lichThiRepository.findByNamHocAndHocKy(namHoc, hocKy);
    }

    public LichThi getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return lichThiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch thi"));
    }

    @Transactional
    public LichThi create(LichThi lichThi) {
        if (lichThi == null) throw new ApiException("Lịch thi không được để trống");
        validateLichThi(lichThi);
        checkDuplicate(lichThi, null);
        checkRoomConflict(lichThi, null);
        return lichThiRepository.save(lichThi);
    }

    @Transactional
    public LichThi update(Integer id, LichThi lichThi) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        getById(id);
        validateLichThi(lichThi);
        checkDuplicate(lichThi, id);
        checkRoomConflict(lichThi, id);
        lichThi.setId(id);
        return lichThiRepository.save(lichThi);
    }

    @Transactional
    public void autoGenerate(AutoGenerateExamRequest request) {
        String namHocStr = request.getNamHoc();
        Integer hocKy = request.getHocKy();
        Integer tuan = request.getTuan();
        String loaiKiemTra = request.getLoaiKiemTra();

        // Xóa sạch thời khóa biểu học của tuần này
        thoiKhoaBieuRepository.deleteByNamHocAndHocKyAndTuan(namHocStr, hocKy, tuan);

        // Tính ngày bắt đầu của tuần thi
        NamHoc nh = namHocRepository.findByTenNamHoc(namHocStr)
                .orElseThrow(() -> new ApiException("Không tìm thấy năm học"));

        LocalDate schoolStart = nh.getNgayBatDauHk1();
        if (schoolStart == null) {
            int startYear = Integer.parseInt(namHocStr.split("-")[0]);
            schoolStart = LocalDate.of(startYear, 9, 5);
        }
        int dow = schoolStart.getDayOfWeek().getValue();
        LocalDate monday = schoolStart.minusDays(dow == 7 ? 6 : dow - 1);
        LocalDate weekMonday = monday.plusDays((tuan - 1) * 7);

        // Xóa sạch lịch thi cũ của tuần này
        lichThiRepository.deleteByNgayThiBetween(weekMonday, weekMonday.plusDays(6));

        List<LopHoc> allLop = lopHocRepository.findAll();
        List<MonHoc> allMon = monHocRepository.findAll();
        
        List<GiaoVien> allGv = giaoVienRepository.findAll();
        if (allGv.size() > 1) {
            Collections.shuffle(allGv);
        }
        int gvIdx = 0;

        // Render lịch thi: Khối thi chung môn trong ngày, 2 môn/ngày
        for (int khoi = 10; khoi <= 12; khoi++) {
            List<MonHoc> monHocKhoi = new ArrayList<>();
            for (MonHoc m : allMon) {
                if (m.getKhoiApDung() != null && m.getKhoiApDung().contains(String.valueOf(khoi))) {
                    String ten = m.getTenMon() != null ? m.getTenMon().toLowerCase() : "";
                    if (!ten.contains("shdc") && !ten.contains("sinh hoạt") && !ten.contains("chào cờ")) {
                        monHocKhoi.add(m);
                    }
                }
            }
            Collections.shuffle(monHocKhoi);

            int monIdx = 0;
            for (int dayOffset = 0; dayOffset < 6; dayOffset++) { // Thứ 2 -> Thứ 7
                LocalDate ngayThi = weekMonday.plusDays(dayOffset);

                List<MonHoc> subjectForDay = new ArrayList<>();
                if (monIdx < monHocKhoi.size()) subjectForDay.add(monHocKhoi.get(monIdx++));
                if (monIdx < monHocKhoi.size()) subjectForDay.add(monHocKhoi.get(monIdx++));

                if (subjectForDay.isEmpty()) continue;

                for (LopHoc lop : allLop) {
                    if (lop.getKhoi() == khoi) {
                        for (int i = 0; i < subjectForDay.size(); i++) {
                            LichThi lt = new LichThi();
                            lt.setLop(lop);
                            lt.setMonHoc(subjectForDay.get(i));
                            lt.setLoaiKiemTra(loaiKiemTra);
                            lt.setNgayThi(ngayThi);
                            lt.setGioBatDau(i == 0 ? LocalTime.of(7, 30) : LocalTime.of(9, 30));
                            lt.setThoiGianLamBai(45);
                            lt.setPhongThi(lop.getTenLop()); // Phòng = Tên lớp
                            lt.setHocKy(hocKy);
                            lt.setNamHoc(namHocStr);
                            
                            if (allGv.size() > 1) {
                                GiaoVien gt1 = allGv.get(gvIdx++ % allGv.size());
                                GiaoVien gt2 = allGv.get(gvIdx++ % allGv.size());
                                if (gt1.getId().equals(gt2.getId())) {
                                    gt2 = allGv.get(gvIdx++ % allGv.size());
                                }
                                lt.setGiamThi1(gt1);
                                lt.setGiamThi2(gt2);
                            }

                            lichThiRepository.save(lt);
                        }
                    }
                }
            }
        }
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        lichThiRepository.deleteById(id);
    }

    /**
     * Kiểm tra trùng lịch thi: cùng lớp, cùng môn, cùng loại kiểm tra, cùng học kỳ năm học
     */
    private void checkDuplicate(LichThi lichThi, Integer excludeId) {
        if (lichThi.getLop() == null || lichThi.getMonHoc() == null ||
            lichThi.getLoaiKiemTra() == null || lichThi.getHocKy() == null || lichThi.getNamHoc() == null) {
            return;
        }

        Optional<LichThi> existing = lichThiRepository.findByLopIdAndMonHocIdAndLoaiKiemTraAndHocKyAndNamHoc(
                lichThi.getLop().getId(),
                lichThi.getMonHoc().getId(),
                lichThi.getLoaiKiemTra(),
                lichThi.getHocKy(),
                lichThi.getNamHoc()
        );

        if (existing.isPresent() && (excludeId == null || !existing.get().getId().equals(excludeId))) {
            throw new ApiException(String.format(
                "Trùng lịch thi: Lớp %s đã có lịch %s môn %s học kỳ %d năm học %s",
                lichThi.getLop().getTenLop(),
                lichThi.getLoaiKiemTra(),
                lichThi.getMonHoc().getTenMon(),
                lichThi.getHocKy(),
                lichThi.getNamHoc()
            ));
        }
    }

    /**
     * Kiểm tra trùng phòng thi: cùng ngày, cùng giờ, cùng phòng
     */
    private void checkRoomConflict(LichThi lichThi, Integer excludeId) {
        if (lichThi.getNgayThi() == null || lichThi.getGioBatDau() == null ||
            lichThi.getPhongThi() == null || lichThi.getPhongThi().isBlank() ||
            lichThi.getThoiGianLamBai() == null) {
            return;
        }

        LocalTime gioKetThuc = lichThi.getGioBatDau().plusMinutes(lichThi.getThoiGianLamBai());
        LocalTime gioBatDauCheck = lichThi.getGioBatDau().minusMinutes(lichThi.getThoiGianLamBai());

        List<LichThi> conflicts = lichThiRepository.findConflictingRoom(
                lichThi.getNgayThi(),
                lichThi.getPhongThi(),
                gioBatDauCheck,
                gioKetThuc,
                lichThi.getGioBatDau()
        );

        for (LichThi conflict : conflicts) {
            if (excludeId != null && conflict.getId().equals(excludeId)) continue;

            // Kiểm tra xem có thực sự trùng giờ không
            LocalTime conflictEnd = conflict.getGioBatDau().plusMinutes(conflict.getThoiGianLamBai());
            boolean overlap = lichThi.getGioBatDau().isBefore(conflictEnd) &&
                             conflict.getGioBatDau().isBefore(gioKetThuc);

            if (overlap) {
                throw new ApiException(String.format(
                    "Trùng phòng thi: Phòng %s đã được sử dụng từ %s đến %s ngày %s",
                    lichThi.getPhongThi(),
                    conflict.getGioBatDau(),
                    conflictEnd,
                    lichThi.getNgayThi()
                ));
            }
        }
    }

    private void validateLichThi(LichThi lichThi) {
        if (lichThi.getLop() == null) throw new ApiException("Thiếu thông tin lớp");
        if (lichThi.getMonHoc() == null) throw new ApiException("Thiếu thông tin môn học");
        if (lichThi.getNgayThi() == null) throw new ApiException("Thiếu ngày thi");
        if (lichThi.getGioBatDau() == null) throw new ApiException("Thiếu giờ bắt đầu");
        if (lichThi.getThoiGianLamBai() == null || lichThi.getThoiGianLamBai() <= 0) {
            throw new ApiException("Thời gian làm bài phải lớn hơn 0");
        }
        if (lichThi.getHocKy() == null) throw new ApiException("Thiếu học kỳ");
        if (lichThi.getNamHoc() == null || lichThi.getNamHoc().isBlank()) throw new ApiException("Thiếu năm học");

        // Kiểm tra giám thị 1 và giám thị 2 không được trùng nhau
        if (lichThi.getGiamThi1() != null && lichThi.getGiamThi2() != null
                && lichThi.getGiamThi1().getId() != null
                && lichThi.getGiamThi1().getId().equals(lichThi.getGiamThi2().getId())) {
            throw new ApiException("Giám thị 1 và Giám thị 2 không được trùng nhau");
        }
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public boolean isExamWeek(String namHocStr, Integer tuan) {
        if (namHocStr == null || tuan == null) return false;
        
        com.hethongtruongthpt.entity.NamHoc nh = namHocRepository.findByTenNamHoc(namHocStr).orElse(null);
        if (nh == null) return false;

        java.time.LocalDate schoolStart = nh.getNgayBatDauHk1();
        if (schoolStart == null) {
            int startYear = Integer.parseInt(namHocStr.split("-")[0]);
            schoolStart = java.time.LocalDate.of(startYear, 9, 5);
        }
        int dow = schoolStart.getDayOfWeek().getValue();
        java.time.LocalDate monday = schoolStart.minusDays(dow == 7 ? 6 : dow - 1);
        java.time.LocalDate weekMonday = monday.plusDays((tuan - 1) * 7);

        java.util.List<LichThi> exams = lichThiRepository.findByNgayThiBetween(weekMonday, weekMonday.plusDays(6));
        return exams != null && !exams.isEmpty();
    }
}
