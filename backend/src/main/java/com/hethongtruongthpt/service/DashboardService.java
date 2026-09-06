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

    private final NamHocRepository namHocRepository;
    private final ThoiKhoaBieuCrudService thoiKhoaBieuCrudService;
    private final LichSuHocTapRepository lichSuHocTapRepository;

    public DashboardService(HocSinhService hocSinhService,
                            ThongBaoRepository thongBaoRepository,
                            ThoiKhoaBieuRepository thoiKhoaBieuRepository,
                            LichThiRepository lichThiRepository,
                            DiemRepository diemRepository,
                            HanhKiemRepository hanhKiemRepository,
                            DiemDanhService diemDanhService,
                            MonHocRepository monHocRepository,
                            DiemCalculationService diemCalculationService,
                            NamHocRepository namHocRepository,
                            ThoiKhoaBieuCrudService thoiKhoaBieuCrudService,
                            LichSuHocTapRepository lichSuHocTapRepository) {
        this.hocSinhService = hocSinhService;
        this.thongBaoRepository = thongBaoRepository;
        this.thoiKhoaBieuRepository = thoiKhoaBieuRepository;
        this.lichThiRepository = lichThiRepository;
        this.diemRepository = diemRepository;
        this.hanhKiemRepository = hanhKiemRepository;
        this.diemDanhService = diemDanhService;
        this.monHocRepository = monHocRepository;
        this.diemCalculationService = diemCalculationService;
        this.namHocRepository = namHocRepository;
        this.thoiKhoaBieuCrudService = thoiKhoaBieuCrudService;
        this.lichSuHocTapRepository = lichSuHocTapRepository;
    }

    public DashboardDataDTO getStudentDashboard(String username) {
        HocSinh hocSinh = hocSinhService.getByUsername(username);
        return buildDashboardForHocSinh(hocSinh);
    }

    public DashboardDataDTO getDashboardByHocSinhId(Integer hocSinhId) {
        HocSinh hocSinh = hocSinhService.getById(hocSinhId);
        return buildDashboardForHocSinh(hocSinh);
    }

    public List<ThoiKhoaBieu> getTimetableForStudent(String username, LocalDate date) {
        HocSinh hocSinh = hocSinhService.getByUsername(username);
        return getTimetableForHocSinh(hocSinh, date);
    }

    private List<ThoiKhoaBieu> getTimetableForHocSinh(HocSinh hocSinh, LocalDate targetDate) {
        if (hocSinh == null) {
            return new ArrayList<>();
        }

        int curMonth = targetDate.getMonthValue();
        String calcNamHoc = curMonth >= 8
                ? targetDate.getYear() + "-" + (targetDate.getYear() + 1)
                : (targetDate.getYear() - 1) + "-" + targetDate.getYear();

        List<com.hethongtruongthpt.entity.NamHoc> allNamHocs = namHocRepository.findAll();
        com.hethongtruongthpt.entity.NamHoc matchingNamHoc = null;

        for (com.hethongtruongthpt.entity.NamHoc nh : allNamHocs) {
            if (nh.getNgayBatDauHk1() != null && nh.getNgayKetThucHk2() != null) {
                if (!targetDate.isBefore(nh.getNgayBatDauHk1()) && !targetDate.isAfter(nh.getNgayKetThucHk2())) {
                    matchingNamHoc = nh;
                    break;
                }
            }
        }

        if (matchingNamHoc == null) {
            for (com.hethongtruongthpt.entity.NamHoc nh : allNamHocs) {
                if (calcNamHoc.equals(nh.getTenNamHoc())) {
                    matchingNamHoc = nh;
                    break;
                }
            }
        }

        String targetNamHoc = matchingNamHoc != null ? matchingNamHoc.getTenNamHoc() : calcNamHoc;
        int curHocKy = 1;
        int currentWeek = 1;

        if (matchingNamHoc != null) {
            // Nếu ngày xem trước ngày bắt đầu HK1 hoặc sau ngày kết thúc HK2 -> Chưa bắt đầu hoặc đã kết thúc năm học
            if (matchingNamHoc.getNgayBatDauHk1() != null && targetDate.isBefore(matchingNamHoc.getNgayBatDauHk1())) {
                return new ArrayList<>();
            }
            if (matchingNamHoc.getNgayKetThucHk2() != null && targetDate.isAfter(matchingNamHoc.getNgayKetThucHk2())) {
                return new ArrayList<>();
            }
            if (matchingNamHoc.getNgayKetThucHk1() != null && matchingNamHoc.getNgayBatDauHk2() != null 
                    && targetDate.isAfter(matchingNamHoc.getNgayKetThucHk1()) && targetDate.isBefore(matchingNamHoc.getNgayBatDauHk2())) {
                return new ArrayList<>();
            }

            if (matchingNamHoc.getNgayBatDauHk2() != null && !targetDate.isBefore(matchingNamHoc.getNgayBatDauHk2())) {
                curHocKy = 2;
            } else if (matchingNamHoc.getNgayBatDauHk1() != null && !targetDate.isBefore(matchingNamHoc.getNgayBatDauHk1())) {
                curHocKy = 1;
            } else {
                curHocKy = 1;
            }
            currentWeek = com.hethongtruongthpt.util.SchoolWeekUtils.weekNumber(matchingNamHoc, targetDate);
            if (currentWeek < 1) {
                return new ArrayList<>();
            }
        } else {
            curHocKy = (curMonth >= 8 || curMonth <= 1) ? 1 : 2;
            currentWeek = 1;
        }

        // Tìm lớp của học sinh trong năm học targetNamHoc
        Integer targetLopId = null;
        List<LichSuHocTap> histories = lichSuHocTapRepository.findByHocSinhIdOrderByNamHocDesc(hocSinh.getId());
        for (LichSuHocTap ls : histories) {
            if (targetNamHoc.equals(ls.getNamHoc()) && ls.getLopHoc() != null) {
                targetLopId = ls.getLopHoc().getId();
                break;
            }
        }

        if (targetLopId == null && hocSinh.getLop() != null) {
            targetLopId = hocSinh.getLop().getId();
        }

        if (targetLopId == null) {
            return new ArrayList<>();
        }

        // Nếu tuần này là tuần thi -> Không có lịch học (lịch học tạm dừng)
        boolean isExamWeek = thoiKhoaBieuCrudService.isExamWeek(targetNamHoc, currentWeek);
        if (isExamWeek) {
            return new ArrayList<>();
        }

        List<ThoiKhoaBieu> timetable = thoiKhoaBieuRepository.findByLopIdAndHocKyAndNamHocAndTuan(targetLopId, curHocKy, targetNamHoc, currentWeek);
        if (timetable.isEmpty() && currentWeek > 1) {
            List<ThoiKhoaBieu> week1Timetable = thoiKhoaBieuRepository.findByLopIdAndHocKyAndNamHocAndTuan(targetLopId, curHocKy, targetNamHoc, 1);
            if (!week1Timetable.isEmpty()) {
                timetable = week1Timetable;
            }
        }
        return timetable;
    }

    private DashboardDataDTO buildDashboardForHocSinh(HocSinh hocSinh) {
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

        List<com.hethongtruongthpt.entity.NamHoc> activeNamHocs = namHocRepository.findByTrangThai("DANG_MO");
        if (!activeNamHocs.isEmpty()) {
            com.hethongtruongthpt.entity.NamHoc active = activeNamHocs.get(0);
            curNamHoc = active.getTenNamHoc();
            
            if (active.getNgayBatDauHk2() != null && !now.isBefore(active.getNgayBatDauHk2())) {
                curHocKy = 2;
            } else if (active.getNgayBatDauHk1() != null && !now.isBefore(active.getNgayBatDauHk1())) {
                curHocKy = 1;
            }
        }

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
            timetable = getTimetableForHocSinh(hocSinh, now);
            
            int currentWeek = 1;
            if (!activeNamHocs.isEmpty()) {
                currentWeek = com.hethongtruongthpt.util.SchoolWeekUtils.weekNumber(activeNamHocs.get(0), now);
            }
            boolean isExamWeek = thoiKhoaBieuCrudService.isExamWeek(curNamHoc, currentWeek);
            dashboardData.setExamWeek(isExamWeek);
        }
        dashboardData.setTimetable(timetable);

        // 3. Exams (Lấy tất cả các lớp của học sinh từ lớp hiện tại và lịch sử học tập)
        List<LichThi> exams = new ArrayList<>();
        java.util.Set<Integer> studentLopIds = new java.util.HashSet<>();
        if (lopId != null) {
            studentLopIds.add(lopId);
        }
        List<LichSuHocTap> studentHistories = lichSuHocTapRepository.findByHocSinhIdOrderByNamHocDesc(hocSinhId);
        for (LichSuHocTap ls : studentHistories) {
            if (ls.getLopHoc() != null) {
                studentLopIds.add(ls.getLopHoc().getId());
            }
        }

        for (Integer lId : studentLopIds) {
            exams.addAll(lichThiRepository.findByLopId(lId));
        }

        exams = exams.stream()
            .distinct()
            .sorted((a, b) -> {
                if (a.getNgayThi() == null) return 1;
                if (b.getNgayThi() == null) return -1;
                return b.getNgayThi().compareTo(a.getNgayThi());
            })
            .collect(Collectors.toList());
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
        
        final String finalCurNamHoc = curNamHoc;
        final int finalCurHocKy = curHocKy;
        List<Diem> semesterScores = rawScores.stream()
                .filter(d -> finalCurNamHoc.equals(d.getNamHoc()) && Integer.valueOf(finalCurHocKy).equals(d.getHocKy()))
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
