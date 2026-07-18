package com.hethongtruongthpt.config;

import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.LichThi;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.LichThiRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.MonHocRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
@Order(4)
public class ExamScheduleSeeder implements CommandLineRunner {
    private final LichThiRepository lichThiRepository;
    private final LopHocRepository lopHocRepository;
    private final MonHocRepository monHocRepository;
    private final GiaoVienRepository giaoVienRepository;

    public ExamScheduleSeeder(LichThiRepository lichThiRepository,
                              LopHocRepository lopHocRepository,
                              MonHocRepository monHocRepository,
                              GiaoVienRepository giaoVienRepository) {
        this.lichThiRepository = lichThiRepository;
        this.lopHocRepository = lopHocRepository;
        this.monHocRepository = monHocRepository;
        this.giaoVienRepository = giaoVienRepository;
    }

    @Override
    public void run(String... args) {
        if (lichThiRepository.count() > 0) return;

        List<LopHoc> lops = lopHocRepository.findByNamHoc("2025-2026");
        List<MonHoc> monHocs = monHocRepository.findAll();
        List<GiaoVien> giaoViens = giaoVienRepository.findAll();
        if (lops.isEmpty() || monHocs.isEmpty()) return;

        // Sort classes: 10A1, 10A2, ..., 11A1, ..., 12A1, ...
        lops.sort(Comparator.comparing(LopHoc::getTenLop, Comparator.comparingInt((String s) -> {
            try { return Integer.parseInt(s.replaceAll("\\D+", "").substring(0, 2)); } catch (Exception e) { return 0; }
        }).thenComparing(Comparator.naturalOrder())));

        // Room mapping: P01 = 10A1, ..., P15 = 12A5
        java.util.Map<Integer, String> classRoom = new java.util.HashMap<>();
        for (int i = 0; i < lops.size(); i++) {
            classRoom.put(lops.get(i).getId(), String.format("P%02d", i + 1));
        }

        // 8 môn thi chính
        String[] examSubjects = {"Toán", "Ngữ văn", "Tiếng Anh", "Vật lí", "Hóa học", "Sinh học", "Lịch sử", "Địa lí"};

        // Thời gian: khối 10/11 = sáng, khối 12 = chiều
        LocalTime sang1 = LocalTime.of(7, 30);
        LocalTime sang2 = LocalTime.of(9, 30);
        LocalTime chieu1 = LocalTime.of(13, 30);
        LocalTime chieu2 = LocalTime.of(15, 30);

        // Lịch thi HK1
        LocalDate[] gkDatesHk1 = {
            LocalDate.of(2025, 11, 10), LocalDate.of(2025, 11, 11),
            LocalDate.of(2025, 11, 12), LocalDate.of(2025, 11, 13),
            LocalDate.of(2025, 11, 14)
        };
        LocalDate[] ckDatesHk1 = {
            LocalDate.of(2025, 12, 22), LocalDate.of(2025, 12, 23),
            LocalDate.of(2025, 12, 24), LocalDate.of(2025, 12, 25),
            LocalDate.of(2025, 12, 26), LocalDate.of(2025, 12, 27)
        };

        // Lịch thi HK2
        LocalDate[] gkDatesHk2 = {
            LocalDate.of(2026, 4, 6), LocalDate.of(2026, 4, 7),
            LocalDate.of(2026, 4, 8), LocalDate.of(2026, 4, 9),
            LocalDate.of(2026, 4, 10)
        };
        LocalDate[] ckDatesHk2 = {
            LocalDate.of(2026, 5, 25), LocalDate.of(2026, 5, 26),
            LocalDate.of(2026, 5, 27), LocalDate.of(2026, 5, 28),
            LocalDate.of(2026, 5, 29), LocalDate.of(2026, 5, 30)
        };

        // Phòng random cho GK/CK
        String[] randomRooms = {"P01","P02","P03","P04","P05","P06","P07","P08","P09","P10","P11","P12","P13","P14","P15"};
        int roomIdx = 0;

        // Giám thị: luân phiên giáo viên (không trùng môn thi)
        int gvIdx = 0;

        List<LichThi> allExams = new ArrayList<>();

        // Tạo lịch thi cho cả HK1 và HK2
        int[][] hkConfig = {
            {1, 0}, // HK1
            {2, 1}  // HK2
        };

        for (int[] hk : hkConfig) {
            int hocKy = hk[0];
            LocalDate[] gkDates = (hocKy == 1) ? gkDatesHk1 : gkDatesHk2;
            LocalDate[] ckDates = (hocKy == 1) ? ckDatesHk1 : ckDatesHk2;

            for (LopHoc lop : lops) {
                int khoi = lop.getKhoi();
                boolean isKhoi12 = khoi == 12;
                String phongHoc = classRoom.get(lop.getId());

                for (int monIdx = 0; monIdx < examSubjects.length; monIdx++) {
                    final String subjectName = examSubjects[monIdx];
                    MonHoc mon = monHocs.stream()
                        .filter(m -> m.getTenMon().equals(subjectName))
                        .findFirst().orElse(null);
                    if (mon == null) continue;

                    // Thời gian: khối 12 = chiều, 10/11 = sáng
                    LocalTime gkTime = isKhoi12 ? ((monIdx % 2 == 0) ? chieu1 : chieu2) : ((monIdx % 2 == 0) ? sang1 : sang2);
                    LocalTime ckTime = isKhoi12 ? ((monIdx % 2 == 0) ? chieu1 : chieu2) : ((monIdx % 2 == 0) ? sang1 : sang2);

                    // Chọn 2 giám thị (không dạy môn này cho lớp này)
                    GiaoVien gt1 = null, gt2 = null;
                    if (!giaoViens.isEmpty()) {
                        // Tìm giáo viên không dạy môn này
                        List<GiaoVien> candidates = giaoViens.stream()
                            .filter(gv -> !gv.getBoMon().equals(subjectName))
                            .toList();
                        if (candidates.size() >= 2) {
                            gt1 = candidates.get(gvIdx % candidates.size());
                            gt2 = candidates.get((gvIdx + 1) % candidates.size());
                            gvIdx += 2;
                        } else if (candidates.size() == 1) {
                            gt1 = candidates.get(0);
                            gt2 = candidates.get(0);
                        }
                    }

                    // GK (45 phút) - random phòng
                    LichThi gk = new LichThi();
                    gk.setLop(lop); gk.setMonHoc(mon); gk.setLoaiKiemTra("GK");
                    gk.setNgayThi(gkDates[Math.min(monIdx / 2, gkDates.length - 1)]);
                    gk.setGioBatDau(gkTime); gk.setThoiGianLamBai(45);
                    gk.setPhongThi(randomRooms[roomIdx % randomRooms.length]); roomIdx++;
                    gk.setGiamThi1(gt1); gk.setGiamThi2(gt2);
                    gk.setHocKy(hocKy); gk.setNamHoc("2025-2026");
                    allExams.add(gk);

                    // CK (90 phút) - random phòng
                    LichThi ck = new LichThi();
                    ck.setLop(lop); ck.setMonHoc(mon); ck.setLoaiKiemTra("CK");
                    ck.setNgayThi(ckDates[Math.min(monIdx / 2, ckDates.length - 1)]);
                    ck.setGioBatDau(ckTime); ck.setThoiGianLamBai(90);
                    ck.setPhongThi(randomRooms[roomIdx % randomRooms.length]); roomIdx++;
                    ck.setGiamThi1(gt1); ck.setGiamThi2(gt2);
                    ck.setHocKy(hocKy); ck.setNamHoc("2025-2026");
                    allExams.add(ck);

                    // TP15 (15 phút) - phòng học chính
                    LichThi tp15 = new LichThi();
                    tp15.setLop(lop); tp15.setMonHoc(mon); tp15.setLoaiKiemTra("TP15");
                    tp15.setNgayThi(gkDates[Math.min(monIdx / 2, gkDates.length - 1)]);
                    tp15.setGioBatDau(isKhoi12 ? chieu2 : sang2);
                    tp15.setThoiGianLamBai(15); tp15.setPhongThi(phongHoc);
                    tp15.setGiamThi1(gt1); tp15.setGiamThi2(gt2);
                    tp15.setHocKy(hocKy); tp15.setNamHoc("2025-2026");
                    allExams.add(tp15);
                }
            }
        }

        lichThiRepository.saveAll(allExams);
    }
}
