package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.DiemDanh;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.LichSuHocTap;
import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import com.hethongtruongthpt.entity.ThongBao;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.repository.DiemDanhRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.LichSuHocTapRepository;
import com.hethongtruongthpt.repository.LichNamHocRepository;
import com.hethongtruongthpt.repository.ThoiKhoaBieuRepository;
import com.hethongtruongthpt.repository.ThongBaoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;

import java.util.*;
import java.util.stream.Collectors;
import java.util.Comparator;

@Service
public class DiemDanhService {
    private static final Logger log = LoggerFactory.getLogger(DiemDanhService.class);
    private final DiemDanhRepository repository;
    private final HocSinhRepository hocSinhRepository;
    private final LichSuHocTapRepository lichSuHocTapRepository;
    private final LichNamHocRepository lichNamHocRepository;
    private final ThoiKhoaBieuRepository thoiKhoaBieuRepository;
    private final SmsService smsService;
    private final ThongBaoRepository thongBaoRepository;

    public DiemDanhService(DiemDanhRepository repository, HocSinhRepository hocSinhRepository, LichSuHocTapRepository lichSuHocTapRepository, LichNamHocRepository lichNamHocRepository, ThoiKhoaBieuRepository thoiKhoaBieuRepository, SmsService smsService, ThongBaoRepository thongBaoRepository) {
        this.repository = repository;
        this.hocSinhRepository = hocSinhRepository;
        this.lichSuHocTapRepository = lichSuHocTapRepository;
        this.lichNamHocRepository = lichNamHocRepository;
        this.thoiKhoaBieuRepository = thoiKhoaBieuRepository;
        this.smsService = smsService;
        this.thongBaoRepository = thongBaoRepository;
    }

    public List<DiemDanh> getByNgayAndLopHocId(LocalDate ngay, Integer lopHocId) {
        return repository.findByNgayAndLopHocId(ngay, lopHocId);
    }

    public List<DiemDanh> getByNgayAndLopHocIdAndTietHoc(LocalDate ngay, Integer lopHocId, Integer tietHoc) {
        return repository.findByNgayAndLopHocIdAndTietHoc(ngay, lopHocId, tietHoc);
    }

    public boolean isLocked(LocalDate ngay, Integer lopHocId) {
        return repository.existsByNgayAndLopHocId(ngay, lopHocId);
    }

    public boolean isLocked(LocalDate ngay, Integer lopHocId, Integer tietHoc) {
        return repository.existsByNgayAndLopHocIdAndTietHoc(ngay, lopHocId, tietHoc);
    }

    /**
     * Đếm số ngày học thực tế đã diễn ra tính theo thời gian thực (tối đa đến ngày hôm nay).
     * Bắt đầu tuần 1 từ ngày 07/09 theo thời khóa biểu.
     * Chỉ tính những ngày có trên thời khóa biểu của lớp (nếu chưa có TKB thì tính Thứ 2 - Thứ 7).
     */
    private long countPassedSchoolDays(LocalDate from, LocalDate to, Integer lopId) {
        if (from == null || to == null || from.isAfter(to)) return 0;
        
        LocalDate actualStart = from;
        if (from.getMonthValue() == 9 && from.getDayOfMonth() < 7) {
            actualStart = LocalDate.of(from.getYear(), 9, 7);
        }

        LocalDate today = LocalDate.now();
        LocalDate effectiveTo = to.isAfter(today) ? today : to;
        if (actualStart.isAfter(effectiveTo)) return 0;

        Set<Integer> activeDaysOfWeek = new HashSet<>();
        if (lopId != null) {
            List<ThoiKhoaBieu> tkbList = thoiKhoaBieuRepository.findByLopId(lopId);
            for (ThoiKhoaBieu tkb : tkbList) {
                if (tkb.getThu() != null) {
                    activeDaysOfWeek.add(tkb.getThu());
                }
            }
        }

        long count = 0;
        LocalDate cur = actualStart;
        while (!cur.isAfter(effectiveTo)) {
            int dayOfWeekValue = cur.getDayOfWeek().getValue() + 1; // Mon=2, Tue=3, ..., Sat=7, Sun=8
            if (!activeDaysOfWeek.isEmpty()) {
                if (activeDaysOfWeek.contains(dayOfWeekValue)) {
                    count++;
                }
            } else {
                if (cur.getDayOfWeek() != DayOfWeek.SUNDAY) {
                    count++;
                }
            }
            cur = cur.plusDays(1);
        }
        return count;
    }

    /**
     * Đếm tổng số ngày học toàn năm theo kế hoạch (bắt đầu tuần 1 từ 07/09).
     */
    private long countTotalPlannedSchoolDays(LocalDate from, LocalDate to, Integer lopId) {
        if (from == null || to == null || from.isAfter(to)) return 0;

        LocalDate actualStart = from;
        if (from.getMonthValue() == 9 && from.getDayOfMonth() < 7) {
            actualStart = LocalDate.of(from.getYear(), 9, 7);
        }

        Set<Integer> activeDaysOfWeek = new HashSet<>();
        if (lopId != null) {
            List<ThoiKhoaBieu> tkbList = thoiKhoaBieuRepository.findByLopId(lopId);
            for (ThoiKhoaBieu tkb : tkbList) {
                if (tkb.getThu() != null) {
                    activeDaysOfWeek.add(tkb.getThu());
                }
            }
        }

        long count = 0;
        LocalDate cur = actualStart;
        while (!cur.isAfter(to)) {
            int dayOfWeekValue = cur.getDayOfWeek().getValue() + 1;
            if (!activeDaysOfWeek.isEmpty()) {
                if (activeDaysOfWeek.contains(dayOfWeekValue)) {
                    count++;
                }
            } else {
                if (cur.getDayOfWeek() != DayOfWeek.SUNDAY) {
                    count++;
                }
            }
            cur = cur.plusDays(1);
        }
        return count;
    }

    /**
     * Đếm số ngày học thực tế trong khoảng thời gian thông qua bảng LichNamHoc, 
     * nếu chưa cấu hình thì fallback đếm số ngày đi học (Thứ 2 - Thứ 7).
     */
    private long countSchoolDays(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) return 0;

        long dbDays = lichNamHocRepository.countNgayHocBetween(from, to);
        if (dbDays > 0) return dbDays;
        long count = 0;
        LocalDate cur = from;
        while (!cur.isAfter(to)) {
            if (cur.getDayOfWeek() != java.time.DayOfWeek.SUNDAY) {
                count++;
            }
            cur = cur.plusDays(1);
        }
        return count;
    }

    @Transactional
    public List<DiemDanh> saveAll(List<DiemDanh> records) {
        if (records == null || records.isEmpty()) {
            throw new ApiException("Danh sách điểm danh trống");
        }

        LocalDate ngay = records.get(0).getNgay();
        Integer lopHocId = records.get(0).getLopHoc().getId();
        Integer tietHoc = records.get(0).getTietHoc();

        // Load existing records
        List<DiemDanh> existingList;
        if (tietHoc != null) {
            existingList = repository.findByNgayAndLopHocIdAndTietHoc(ngay, lopHocId, tietHoc);
        } else {
            existingList = repository.findByNgayAndLopHocId(ngay, lopHocId);
        }

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isTeacher = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_GIAO_VIEN"));

        if (isTeacher && !existingList.isEmpty()) {
            throw new ApiException("Điểm danh cho buổi học này đã được lưu và khóa. Vui lòng liên hệ Admin nếu cần chỉnh sửa.");
        }

        Map<Integer, DiemDanh> existingMap = existingList.stream()
                .filter(d -> d.getHocSinh() != null)
                .collect(Collectors.toMap(
                        d -> d.getHocSinh().getId(),
                        d -> d,
                        (existing, replacement) -> existing));

        List<DiemDanh> toSave = new ArrayList<>();
        for (DiemDanh record : records) {
            Integer studentId = record.getHocSinh() != null ? record.getHocSinh().getId() : null;
            DiemDanh matched = existingMap.get(studentId);
            if (matched != null) {
                matched.setLoaiVang(record.getLoaiVang());
                matched.setSoNgayVang(record.getSoNgayVang());
                matched.setCoPhep(record.getCoPhep());
                matched.setKhongPhep(record.getKhongPhep());
                matched.setGhiChu(record.getGhiChu());
                toSave.add(matched);
            } else {
                toSave.add(record);
            }
        }

        List<DiemDanh> saved = repository.saveAll(toSave);

        // Gửi SMS và Thông báo hệ thống cho phụ huynh & học sinh nếu học sinh vắng
        List<DiemDanh> absentRecords = saved.stream()
                .filter(d -> "CO_PHEP".equals(d.getLoaiVang()) || "KHONG_PHEP".equals(d.getLoaiVang()))
                .collect(Collectors.toList());

        if (!absentRecords.isEmpty()) {
            try {
                smsService.sendAbsenceNotifications(absentRecords);
            } catch (Exception e) {
                log.warn("Lỗi khi gửi SMS điểm danh: {}", e.getMessage());
            }

            try {
                for (DiemDanh d : absentRecords) {
                    ThongBao tb = new ThongBao();
                    tb.setTieuDe("Thông báo vắng mặt");
                    String loaiVang = "CO_PHEP".equals(d.getLoaiVang()) ? "có phép" : "không phép";
                    tb.setNoiDung("Bạn đã bị đánh vắng mặt " + loaiVang + " vào ngày " + d.getNgay() + 
                                  (d.getTietHoc() != null ? (" (Tiết " + d.getTietHoc() + ")") : "") + ".");
                    tb.setLoai("HOC_SINH");
                    tb.setHocSinh(d.getHocSinh());
                    if (d.getHocSinh().getUser() != null) {
                        tb.setRecipientId(d.getHocSinh().getUser().getId());
                    }
                    thongBaoRepository.save(tb);
                }
            } catch (Exception e) {
                log.warn("Lỗi khi tạo thông báo vắng mặt trên hệ thống: {}", e.getMessage());
            }
        }

        return saved;
    }

    /**
     * Thong ke chuyen can cho mot lop trong khoang thoi gian.
     * Tính theo NGÀY thực tế đã diễn ra trên TKB (tối đa đến hôm nay).
     * Học sinh không có bản ghi vắng = đi học đầy đủ.
     */
    public Map<String, Object> getStatistics(Integer lopId, LocalDate from, LocalDate to) {
        if (lopId == null) throw new ApiException("Thiếu mã lớp");

        long totalPassedDays = countPassedSchoolDays(from, to, lopId);

        // Fetch all records and group by student + date in Java
        List<DiemDanh> allRecords = repository.findByLopHocIdAndNgayBetween(lopId, from, to);

        // Group by (studentId, date) → determine worst status per day
        Map<String, String> dayWorstStatus = new HashMap<>();
        Map<Integer, String> studentNames = new HashMap<>();
        for (DiemDanh d : allRecords) {
            Integer hsId = d.getHocSinh().getId();
            String key = hsId + "_" + d.getNgay();
            studentNames.putIfAbsent(hsId, d.getHocSinh().getHoTen());

            String current = dayWorstStatus.getOrDefault(key, "CO_MAT");
            String lv = d.getLoaiVang();
            if ("KHONG_PHEP".equals(lv)) {
                dayWorstStatus.put(key, "KHONG_PHEP");
            } else if ("CO_PHEP".equals(lv) && !"KHONG_PHEP".equals(current)) {
                dayWorstStatus.put(key, "CO_PHEP");
            }
        }

        // Count distinct absent days per student
        Map<Integer, long[]> studentAbsences = new HashMap<>(); // [coPhep, khongPhep]
        for (Map.Entry<String, String> entry : dayWorstStatus.entrySet()) {
            String status = entry.getValue();
            if ("CO_MAT".equals(status)) continue;

            String[] parts = entry.getKey().split("_");
            Integer hsId = Integer.parseInt(parts[0]);
            long[] counts = studentAbsences.computeIfAbsent(hsId, k -> new long[]{0, 0});
            if ("KHONG_PHEP".equals(status)) counts[1]++;
            else if ("CO_PHEP".equals(status)) counts[0]++;
        }

        // Get ALL students in the class (including those with no records)
        List<HocSinh> allStudents = hocSinhRepository.findByLopId(lopId);
        Map<Integer, String> allStudentNames = new HashMap<>();
        for (HocSinh hs : allStudents) {
            allStudentNames.put(hs.getId(), hs.getHoTen());
        }

        // Build per-student stats for ALL students
        List<Map<String, Object>> studentStats = new ArrayList<>();
        for (Map.Entry<Integer, String> entry : allStudentNames.entrySet()) {
            Integer hsId = entry.getKey();
            long[] counts = studentAbsences.getOrDefault(hsId, new long[]{0, 0});
            long coPhep = counts[0];
            long khongPhep = counts[1];
            long totalAbsent = coPhep + khongPhep;
            long effectiveTotal = Math.max(totalPassedDays, totalAbsent);
            long coMat = Math.max(0, effectiveTotal - totalAbsent);
            double rate = effectiveTotal > 0 ? Math.round((1.0 - (double) totalAbsent / effectiveTotal) * 10000) / 100.0 : 100.0;

            Map<String, Object> item = new HashMap<>();
            item.put("hocSinhId", hsId);
            item.put("hoTen", entry.getValue());
            item.put("coMat", coMat);
            item.put("coPhep", coPhep);
            item.put("khongPhep", khongPhep);
            item.put("tongVang", totalAbsent);
            item.put("tongNgayHoc", effectiveTotal);
            item.put("tyLeChuyenCan", rate);
            studentStats.add(item);
        }

        // Sort by absence count descending
        studentStats.sort((a, b) -> Long.compare(
            ((Number) b.get("tongVang")).longValue(),
            ((Number) a.get("tongVang")).longValue()));

        Map<String, Object> result = new HashMap<>();
        result.put("tongNgayHoc", totalPassedDays);
        result.put("lopId", lopId);
        result.put("tuNgay", from);
        result.put("denNgay", to);
        result.put("hocSinh", studentStats);
        return result;
    }

    /**
     * Thong ke chuyen can cho mot hoc sinh.
     * Tính theo thời gian thực (các ngày có lịch học TKB đã diễn ra đến hiện tại).
     * Học sinh không bị đánh vắng -> tính là Có mặt.
     */
    public Map<String, Object> getStudentStatistics(Integer hocSinhId, LocalDate from, LocalDate to) {
        if (hocSinhId == null) throw new ApiException("Thiếu mã học sinh");

        // Fetch all records for this student in date range
        List<DiemDanh> allRecords = repository.findByHocSinhIdAndNgayBetween(hocSinhId, from, to);

        // Determine target academic year from date range
        int fromYear = from.getYear();
        int fromMonth = from.getMonthValue();
        String targetNamHoc = fromMonth >= 8 ? (fromYear + "-" + (fromYear + 1)) : ((fromYear - 1) + "-" + fromYear);

        HocSinh hocSinh = hocSinhRepository.findById(hocSinhId).orElse(null);
        Integer lopId = null;

        // 1. If targetNamHoc matches student's current class namHoc
        if (hocSinh != null && hocSinh.getLop() != null) {
            String curNamHoc = hocSinh.getLop().getNamHoc();
            if (targetNamHoc.equals(curNamHoc)) {
                lopId = hocSinh.getLop().getId();
            }
        }

        // 2. If historical year, look in LichSuHocTap
        if (lopId == null) {
            List<LichSuHocTap> histories = lichSuHocTapRepository.findByHocSinhIdOrderByNamHocDesc(hocSinhId);
            for (LichSuHocTap ls : histories) {
                if (targetNamHoc.equals(ls.getNamHoc()) && ls.getLopHoc() != null) {
                    lopId = ls.getLopHoc().getId();
                    break;
                }
            }
        }

        // 3. Fallback: Check if any attendance record has lopHoc
        if (lopId == null) {
            for (DiemDanh d : allRecords) {
                if (d.getLopHoc() != null) {
                    lopId = d.getLopHoc().getId();
                    break;
                }
            }
        }

        // 4. Default to current class if still not found
        if (lopId == null && hocSinh != null && hocSinh.getLop() != null) {
            lopId = hocSinh.getLop().getId();
        }

        // Group by date → determine worst status per day
        Map<LocalDate, String> dayAbsence = new TreeMap<>(Comparator.reverseOrder());
        Map<LocalDate, List<String>> dayGhiChu = new TreeMap<>(Comparator.reverseOrder());

        for (DiemDanh d : allRecords) {
            LocalDate ngay = d.getNgay();
            String lv = d.getLoaiVang();

            // Chỉ quan tâm bản ghi vắng
            if (!"CO_PHEP".equals(lv) && !"KHONG_PHEP".equals(lv)) {
                if (d.getGhiChu() != null && !d.getGhiChu().isBlank()) {
                    dayGhiChu.computeIfAbsent(ngay, k -> new ArrayList<>()).add(d.getGhiChu());
                }
                continue;
            }

            String current = dayAbsence.getOrDefault(ngay, null);
            if ("KHONG_PHEP".equals(lv)) {
                dayAbsence.put(ngay, "KHONG_PHEP");
            } else if (current == null) {
                dayAbsence.put(ngay, "CO_PHEP");
            }

            if (d.getGhiChu() != null && !d.getGhiChu().isBlank()) {
                dayGhiChu.computeIfAbsent(ngay, k -> new ArrayList<>()).add(d.getGhiChu());
            }
        }

        // Count by status
        long coPhep = 0, khongPhep = 0;
        for (String status : dayAbsence.values()) {
            if ("KHONG_PHEP".equals(status)) khongPhep++;
            else coPhep++;
        }

        long totalAbsent = coPhep + khongPhep;
        long totalPassedDays = countPassedSchoolDays(from, to, lopId);
        if (totalPassedDays < totalAbsent) {
            totalPassedDays = totalAbsent;
        }

        long coMat = Math.max(0, totalPassedDays - totalAbsent);
        double rate = totalPassedDays > 0 ? Math.round((double) coMat / totalPassedDays * 10000) / 100.0 : 100.0;

        // Build details list (chỉ ngày vắng)
        List<Map<String, Object>> details = new ArrayList<>();
        for (Map.Entry<LocalDate, String> entry : dayAbsence.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("ngayDiemDanh", entry.getKey());
            item.put("trangThai", entry.getValue());
            List<String> ghiChus = dayGhiChu.getOrDefault(entry.getKey(), List.of());
            item.put("ghiChu", String.join("; ", ghiChus));
            details.add(item);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("hocSinhId", hocSinhId);
        result.put("tongNgayHoc", totalPassedDays);
        result.put("totalDays", totalPassedDays);
        result.put("present", coMat);
        result.put("excusedAbsent", coPhep);
        result.put("unexcusedAbsent", khongPhep);
        result.put("late", 0);
        result.put("coMat", coMat);
        result.put("coPhep", coPhep);
        result.put("khongPhep", khongPhep);
        result.put("tongNgay", totalPassedDays);
        result.put("tyLeChuyenCan", rate);
        result.put("details", details);
        return result;
    }
}
