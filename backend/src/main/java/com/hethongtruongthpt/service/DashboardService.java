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
    private final PhanCongDayRepository phanCongDayRepository;

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
                            LichSuHocTapRepository lichSuHocTapRepository,
                            PhanCongDayRepository phanCongDayRepository) {
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
        this.phanCongDayRepository = phanCongDayRepository;
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

        // Get current academic year and semester
        LocalDate now = LocalDate.now();
        int curMonth = now.getMonthValue();
        String curNamHoc = curMonth >= 8
                ? now.getYear() + "-" + (now.getYear() + 1)
                : (now.getYear() - 1) + "-" + now.getYear();
        int curHocKy = (curMonth >= 8 || curMonth <= 1) ? 1 : 2;

        List<com.hethongtruongthpt.entity.NamHoc> activeNamHocs = namHocRepository.findByTrangThai("DANG_MO");
        com.hethongtruongthpt.entity.NamHoc activeNamHoc = null;
        if (!activeNamHocs.isEmpty()) {
            activeNamHoc = activeNamHocs.get(0);
            curNamHoc = activeNamHoc.getTenNamHoc();
            
            if (activeNamHoc.getNgayBatDauHk2() != null && !now.isBefore(activeNamHoc.getNgayBatDauHk2())) {
                curHocKy = 2;
            } else if (activeNamHoc.getNgayBatDauHk1() != null && !now.isBefore(activeNamHoc.getNgayBatDauHk1())) {
                curHocKy = 1;
            }
        }

        Integer hocSinhId = hocSinh.getId();

        // Resolve student's class for current school year (curNamHoc) from LichSuHocTap
        List<LichSuHocTap> studentHistories = lichSuHocTapRepository.findByHocSinhIdOrderByNamHocDesc(hocSinhId);
        dashboardData.setAcademicHistories(studentHistories);

        com.hethongtruongthpt.entity.LopHoc activeLop = null;
        for (LichSuHocTap ls : studentHistories) {
            if (curNamHoc.equals(ls.getNamHoc()) && ls.getLopHoc() != null) {
                activeLop = ls.getLopHoc();
                break;
            }
        }
        if (activeLop == null && hocSinh.getLop() != null) {
            if (curNamHoc.equals(hocSinh.getLop().getNamHoc()) || hocSinh.getLop().getNamHoc() == null) {
                activeLop = hocSinh.getLop();
            } else if (studentHistories.isEmpty()) {
                activeLop = hocSinh.getLop();
            }
        }
        if (activeLop == null && hocSinh.getLop() != null) {
            activeLop = hocSinh.getLop();
        }

        Integer lopId = activeLop != null ? activeLop.getId() : (hocSinh.getLop() != null ? hocSinh.getLop().getId() : null);

        // Build student response DTO with active class for the selected school year
        HocSinhResponseDTO studentDTO = HocSinhResponseDTO.fromEntity(hocSinh);
        if (activeLop != null && studentDTO != null) {
            com.hethongtruongthpt.dto.lophoc.LopHocDTO lopDto = new com.hethongtruongthpt.dto.lophoc.LopHocDTO();
            lopDto.setId(activeLop.getId());
            lopDto.setTenLop(activeLop.getTenLop());
            lopDto.setKhoi(activeLop.getKhoi());
            lopDto.setNamHoc(activeLop.getNamHoc());
            lopDto.setSiSo(activeLop.getSiSo());
            lopDto.setPhongHoc(activeLop.getPhongHoc());
            if (activeLop.getGvcn() != null) {
                com.hethongtruongthpt.dto.giaovien.GiaoVienDTO gvDto = new com.hethongtruongthpt.dto.giaovien.GiaoVienDTO();
                gvDto.setId(activeLop.getGvcn().getId());
                gvDto.setHoTen(activeLop.getGvcn().getHoTen());
                gvDto.setEmail(activeLop.getGvcn().getEmail());
                gvDto.setSdt(activeLop.getGvcn().getSoDienThoai());
                lopDto.setGvcn(gvDto);
            }
            studentDTO.setLop(lopDto);
        }
        dashboardData.setStudent(studentDTO);
        dashboardData.setCurrentNamHoc(curNamHoc);
        dashboardData.setCurrentHocKy(curHocKy);
        dashboardData.setActiveNamHoc(activeNamHoc);
        dashboardData.setAllNamHocs(namHocRepository.findAll());

        // 1. Notices (Chỉ lấy thông báo dành cho học sinh hoặc toàn trường)
        List<ThongBao> notices = thongBaoRepository.findAll().stream()
                .filter(tb -> {
                    if (tb.getLoai() == null) return false;
                    String l = tb.getLoai().toUpperCase();
                    return l.contains("HOC_SINH") || l.contains("ALL");
                })
                .filter(tb -> tb.getRecipientId() == null || (hocSinh.getUser() != null && hocSinh.getUser().getId().equals(tb.getRecipientId())))
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

        // 3. Exams & Academic History (Lấy tất cả các lớp của học sinh từ lớp hiện tại và lịch sử học tập)
        List<LichThi> exams = new ArrayList<>();
        java.util.Set<Integer> studentLopIds = new java.util.HashSet<>();
        if (lopId != null) {
            studentLopIds.add(lopId);
        }
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

        // 4. Subjects (Lấy toàn bộ môn học để hỗ trợ đầy đủ các năm học và xem điểm lịch sử)
        List<MonHoc> subjects = monHocRepository.findAll().stream()
                .filter(m -> !Boolean.TRUE.equals(m.getIsDeleted()))
                .sorted((a, b) -> Integer.compare(a.getId() != null ? a.getId() : 0, b.getId() != null ? b.getId() : 0))
                .collect(Collectors.toList());
        dashboardData.setSubjects(subjects);

        // 5. Conducts
        List<HanhKiem> conducts = hanhKiemRepository.findByHocSinhId(hocSinhId);
        if (conducts != null) {
            for (HanhKiem hk : conducts) {
                if (hk != null) {
                    if (hk.getNhanXet() != null) {
                        hk.setNhanXet(cleanVietnameseComments(hk.getNhanXet()));
                    }
                    if (activeLop != null && activeLop.getGvcn() != null) {
                        hk.setGiaoVien(activeLop.getGvcn());
                    } else if (hocSinh.getLop() != null && hocSinh.getLop().getGvcn() != null) {
                        hk.setGiaoVien(hocSinh.getLop().getGvcn());
                    }
                }
            }
        }
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
                // Theo Thông tư 22/2021/TT-BGDĐT: Chỉ tính ĐTB môn khi có đủ điểm Thường xuyên (TX), Giữa kỳ (GK) và Cuối kỳ (CK)
                if (!tx.isEmpty() && gk != null && ck != null) {
                    double sumTx = 0;
                    for (Double val : tx) {
                        sumTx += val;
                    }
                    double avg = (sumTx + 2 * gk + 3 * ck) / (tx.size() + 5);
                    avgScore = Math.round(avg * 10.0) / 10.0;
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
            dashboardData.setGpa(Math.round((sumAvg / countAvg) * 10.0) / 10.0);
        } else {
            dashboardData.setGpa(null);
        }

        return dashboardData;
    }

    public static String cleanVietnameseComments(String text) {
        if (text == null || !text.contains("?")) return text;
        String s = text;
        s = s.replaceAll("(?i)H\\?c sinh xu\\?t s\\?c,?\\s*tích c\\?c tham gia các phong trào thi \\?ua", "Học sinh xuất sắc, tích cực tham gia các phong trào thi đua");
        s = s.replaceAll("(?i)H\\?c sinh ngoan,?\\s*ch\\?m ch\\?,?\\s*g\\?+ng m\\?u,?\\s*có ý th\\?c k\\? lu\\?t r\\?t t\\?t", "Học sinh ngoan, chăm chỉ, gương mẫu, có ý thức kỷ luật rất tốt");
        s = s.replaceAll("(?i)tích c\\?c tham gia các phong trào thi \\?ua", "tích cực tham gia các phong trào thi đua");
        s = s.replaceAll("(?i)có ý th\\?c k\\? lu\\?t r\\?t t\\?t", "có ý thức kỷ luật rất tốt");
        s = s.replaceAll("(?i)ch\\?m ch\\?,?\\s*g\\?+ng m\\?u", "chăm chỉ, gương mẫu");
        s = s.replaceAll("(?i)g\\?+ng m\\?u", "gương mẫu");
        s = s.replaceAll("(?i)H\\?c sinh xu\\?t s\\?c", "Học sinh xuất sắc");
        s = s.replaceAll("(?i)H\\?c sinh ngoan", "Học sinh ngoan");
        s = s.replaceAll("(?i)H\\?c sinh", "Học sinh");
        s = s.replaceAll("(?i)h\\?c sinh", "học sinh");
        s = s.replaceAll("(?i)xu\\?t s\\?c", "xuất sắc");
        s = s.replaceAll("(?i)ch\\?m ch\\?", "chăm chỉ");
        s = s.replaceAll("(?i)ý th\\?c", "ý thức");
        s = s.replaceAll("(?i)k\\? lu\\?t", "kỷ luật");
        s = s.replaceAll("(?i)r\\?t t\\?t", "rất tốt");
        s = s.replaceAll("(?i)t\\?t", "tốt");
        s = s.replaceAll("(?i)tích c\\?c", "tích cực");
        s = s.replaceAll("(?i)thi \\?ua", "thi đua");
        s = s.replaceAll("(?i)ti\\?n b\\?", "tiến bộ");
        s = s.replaceAll("(?i)c\\? g\\?ng", "cố gắng");
        s = s.replaceAll("(?i)phát bi\\?u", "phát biểu");
        s = s.replaceAll("(?i)xây d\\?ng", "xây dựng");
        s = s.replaceAll("(?i)bài h\\?c", "bài học");
        s = s.replaceAll("(?i)k\\?t qu\\?", "kết quả");
        s = s.replaceAll("(?i)rèn luy\\?n", "rèn luyện");
        s = s.replaceAll("(?i)đ\\?o đ\\?c", "đạo đức");
        s = s.replaceAll("(?i)ch\\?p hành", "chấp hành");
        s = s.replaceAll("(?i)n\\?i quy", "nội quy");
        s = s.replaceAll("(?i)nhà tr\\?+ng", "nhà trường");
        s = s.replaceAll("(?i)th\\?y cô", "thầy cô");
        s = s.replaceAll("(?i)b\\?n bè", "bạn bè");
        s = s.replaceAll("(?i)hòa đ\\?ng", "hòa đồng");
        s = s.replaceAll("(?i)giúp đ\\?", "giúp đỡ");
        s = s.replaceAll("(?i)trung th\\?c", "trung thực");
        s = s.replaceAll("(?i)l\\? phép", "lễ phép");
        return s;
    }
}
