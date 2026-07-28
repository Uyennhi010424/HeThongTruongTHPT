package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.hocsinh.DashboardDataDTO;
import com.hethongtruongthpt.dto.hocsinh.DashboardDataDTO.SubjectScoreDTO;
import com.hethongtruongthpt.dto.hocsinh.HocSinhResponseDTO;
import com.hethongtruongthpt.entity.*;
import com.hethongtruongthpt.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {
    private final HocSinhService hocSinhService;
    private final ThongBaoRepository thongBaoRepository;
    private final ThoiKhoaBieuRepository thoiKhoaBieuRepository;
    private final LichThiRepository lichThiRepository;
    private final DiemRepository diemRepository;
    private final HanhKiemRepository hanhKiemRepository;
    private final DiemDanhService diemDanhService;
    private final MonHocRepository monHocRepository;
    private final DiemCalculationService diemCalculationService;

    public DashboardService(HocSinhService hocSinhService,
                            ThongBaoRepository thongBaoRepository,
                            ThoiKhoaBieuRepository thoiKhoaBieuRepository,
                            LichThiRepository lichThiRepository,
                            DiemRepository diemRepository,
                            HanhKiemRepository hanhKiemRepository,
                            DiemDanhService diemDanhService,
                            MonHocRepository monHocRepository,
                            DiemCalculationService diemCalculationService) {
        this.hocSinhService = hocSinhService;
        this.thongBaoRepository = thongBaoRepository;
        this.thoiKhoaBieuRepository = thoiKhoaBieuRepository;
        this.lichThiRepository = lichThiRepository;
        this.diemRepository = diemRepository;
        this.hanhKiemRepository = hanhKiemRepository;
        this.diemDanhService = diemDanhService;
        this.monHocRepository = monHocRepository;
        this.diemCalculationService = diemCalculationService;
    }

    public DashboardDataDTO getStudentDashboard(String username) {
        HocSinh hocSinh = hocSinhService.getByUsername(username);
        if (hocSinh == null) {
            return null;
        }

        DashboardDataDTO dashboardData = new DashboardDataDTO();
        dashboardData.setStudent(HocSinhResponseDTO.fromEntity(hocSinh));

        // Get current academic year and semester
        LocalDate now = LocalDate.now();
        int curMonth = now.getMonthValue();
        String curNamHoc = curMonth >= 8
                ? now.getYear() + "-" + (now.getYear() + 1)
                : (now.getYear() - 1) + "-" + now.getYear();
        int curHocKy = (curMonth >= 8 || curMonth <= 1) ? 1 : 2;

        Integer lopId = hocSinh.getLop() != null ? hocSinh.getLop().getId() : null;
        Integer hocSinhId = hocSinh.getId();

        // 1. Notices
        List<ThongBao> notices = thongBaoRepository.findAll().stream()
                .filter(tb -> "HOC_SINH".equals(tb.getLoai()) || "ALL".equals(tb.getLoai()))
                .sorted((a, b) -> b.getNgayDang().compareTo(a.getNgayDang()))
                .collect(Collectors.toList());
        dashboardData.setNotices(notices);

        // 2. Timetable
        List<ThoiKhoaBieu> timetable = new ArrayList<>();
        if (lopId != null) {
            timetable = thoiKhoaBieuRepository.findByLopIdAndHocKyAndNamHoc(lopId, curHocKy, curNamHoc);
            if (timetable.isEmpty()) {
                timetable = thoiKhoaBieuRepository.findByLopId(lopId);
            }
            if (!timetable.isEmpty()) {
                int maxTuan = timetable.stream().mapToInt(t -> t.getTuan() != null ? t.getTuan() : 0).max().orElse(0);
                if (maxTuan > 0) {
                    timetable = timetable.stream().filter(t -> t.getTuan() != null && t.getTuan() == maxTuan).collect(Collectors.toList());
                }
            }
        }
        dashboardData.setTimetable(timetable);

        // 3. Exams
        List<LichThi> exams = new ArrayList<>();
        if (lopId != null) {
            exams = lichThiRepository.findByLopId(lopId).stream()
                .filter(lt -> lt.getNgayThi() != null && !lt.getNgayThi().isBefore(now))
                .sorted((a, b) -> a.getNgayThi().compareTo(b.getNgayThi()))
                .collect(Collectors.toList());
        }
        dashboardData.setExams(exams);

        // 4. Subjects
        List<MonHoc> subjects = monHocRepository.findAll();
        dashboardData.setSubjects(subjects);

        // 5. Conducts
        List<HanhKiem> conducts = hanhKiemRepository.findByHocSinhId(hocSinhId);
        dashboardData.setConducts(conducts);

        // 6. Attendance Stats
        if (lopId != null) {
            LocalDate yearStart = curMonth >= 8
                    ? LocalDate.of(now.getYear(), 9, 1)
                    : LocalDate.of(now.getYear() - 1, 9, 1);
            Map<String, Object> allStats = diemDanhService.getStatistics(lopId, yearStart, now);
            if (allStats != null && allStats.containsKey("students")) {
                List<Map<String, Object>> studentStats = (List<Map<String, Object>>) allStats.get("students");
                Map<String, Object> myStats = studentStats.stream()
                        .filter(s -> s.get("hocSinhId").equals(hocSinhId))
                        .findFirst()
                        .orElse(null);
                dashboardData.setAttendanceStats(myStats);
            }
        }

        // 7. Scores and GPA calculation
        List<Diem> rawScores = diemRepository.findByHocSinhId(hocSinhId);
        dashboardData.setScores(rawScores); // Keep raw scores if frontend needs it for detailed views
        
        List<Diem> semesterScores = rawScores.stream()
                .filter(d -> curNamHoc.equals(d.getNamHoc()) && Integer.valueOf(curHocKy).equals(d.getHocKy()))
                .collect(Collectors.toList());

        List<SubjectScoreDTO> subjectScores = new ArrayList<>();
        double sumAvg = 0;
        int countAvg = 0;

        for (MonHoc subj : subjects) {
            List<Diem> mhScores = semesterScores.stream()
                    .filter(d -> d.getMonHoc() != null && d.getMonHoc().getId().equals(subj.getId()))
                    .collect(Collectors.toList());

            if (mhScores.isEmpty()) continue;

            if ("NHAN_XET".equalsIgnoreCase(subj.getNhomDanhGia())) {
                String finalNx = mhScores.stream()
                        .filter(d -> "CK".equalsIgnoreCase(d.getLoaiDiem()) && d.getNhanXet() != null)
                        .map(Diem::getNhanXet).findFirst()
                        .orElse(mhScores.stream()
                            .filter(d -> "GK".equalsIgnoreCase(d.getLoaiDiem()) && d.getNhanXet() != null)
                            .map(Diem::getNhanXet).findFirst()
                            .orElse(mhScores.stream()
                                .filter(d -> "TX".equalsIgnoreCase(d.getLoaiDiem()) && d.getNhanXet() != null)
                                .map(Diem::getNhanXet).findFirst().orElse(null)));
                
                String val = null;
                if ("DAT".equals(finalNx)) val = "Đạt";
                else if ("CHUA_DAT".equals(finalNx)) val = "Chưa đạt";
                subjectScores.add(new SubjectScoreDTO(subj.getId(), subj.getTenMon(), null, null, null, null, val));
            } else {
                List<Double> tx = new ArrayList<>();
                Double gk = null;
                Double ck = null;

                for (Diem d : mhScores) {
                    if (d.getGiaTriDiem() == null) continue;
                    double v = d.getGiaTriDiem().doubleValue();
                    if ("TX".equalsIgnoreCase(d.getLoaiDiem()) || "MIENG".equalsIgnoreCase(d.getLoaiDiem()) || "15p".equalsIgnoreCase(d.getLoaiDiem()) || "15'".equalsIgnoreCase(d.getLoaiDiem())) {
                        tx.add(v);
                    } else if ("GK".equalsIgnoreCase(d.getLoaiDiem()) || "1t".equalsIgnoreCase(d.getLoaiDiem())) {
                        gk = v;
                    } else if ("CK".equalsIgnoreCase(d.getLoaiDiem()) || "thi".equalsIgnoreCase(d.getLoaiDiem())) {
                        ck = v;
                    }
                }

                double avgTx = 0;
                int txCount = 0;
                if (!tx.isEmpty()) {
                    for (Double val : tx) {
                        avgTx += val;
                        txCount++;
                    }
                    avgTx /= txCount;
                } else {
                    avgTx = -1; // Not calculated yet
                }

                Double avgScore = null;
                double ws = 0;
                int wt = 0;
                if (avgTx != -1) {
                    ws += avgTx * 1;
                    wt += 1;
                }
                if (gk != null) {
                    ws += gk * 2;
                    wt += 2;
                }
                if (ck != null) {
                    ws += ck * 3;
                    wt += 3;
                }
                if (wt > 0) {
                    avgScore = Math.round((ws / wt) * 100.0) / 100.0;
                    sumAvg += avgScore;
                    countAvg++;
                }

                subjectScores.add(new SubjectScoreDTO(subj.getId(), subj.getTenMon(), 
                        avgTx != -1 ? Math.round(avgTx * 100.0) / 100.0 : null, gk, ck, avgScore, null));
            }
        }
        
        dashboardData.setSubjectScores(subjectScores);

        // Simple GPA calculation for numeric subjects
        if (countAvg > 0) {
            dashboardData.setGpa(Math.round((sumAvg / countAvg) * 100.0) / 100.0);
        } else {
            dashboardData.setGpa(null);
        }

        return dashboardData;
    }
}
