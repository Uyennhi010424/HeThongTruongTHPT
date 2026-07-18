package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.DiemDanh;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.repository.DiemDanhRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
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
    private final SmsService smsService;

    public DiemDanhService(DiemDanhRepository repository, HocSinhRepository hocSinhRepository, SmsService smsService) {
        this.repository = repository;
        this.hocSinhRepository = hocSinhRepository;
        this.smsService = smsService;
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
     * Đếm số ngày học (thứ 2 → thứ 7) trong khoảng thời gian.
     * Bỏ chủ nhật.
     */
    private long countSchoolDays(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) return 0;
        long count = 0;
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (d.getDayOfWeek() != DayOfWeek.SUNDAY) count++;
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

        Map<Integer, DiemDanh> existingMap = existingList.stream()
            .collect(Collectors.toMap(
                e -> e.getHocSinh().getId(),
                e -> e,
                (a, b) -> a
            ));

        List<DiemDanh> toSave = new ArrayList<>();
        for (DiemDanh record : records) {
            Integer studentId = record.getHocSinh().getId();
            DiemDanh matched = existingMap.get(studentId);

            if (matched != null) {
                matched.setLoaiVang(record.getLoaiVang());
                matched.setTietHoc(record.getTietHoc());
                matched.setMonHocId(record.getMonHocId());
                matched.setSoNgayVang(record.getSoNgayVang());
                matched.setGhiChu(record.getGhiChu());
                toSave.add(matched);
            } else {
                toSave.add(record);
            }
        }

        List<DiemDanh> saved = repository.saveAll(toSave);

        // Send SMS for absent students
        try {
            List<DiemDanh> absentRecords = saved.stream()
                .filter(d -> "CO_PHEP".equals(d.getLoaiVang()) || "KHONG_PHEP".equals(d.getLoaiVang()))
                .collect(Collectors.toList());
            if (!absentRecords.isEmpty()) {
                smsService.sendAbsenceNotifications(absentRecords);
            }
        } catch (Exception e) {
            log.warn("Không thể gửi SMS thông báo vắng mặt: {}", e.getMessage());
        }

        return saved;
    }

    /**
     * Thong ke chuyen can cho mot lop trong khoang thoi gian.
     * Tính theo NGÀY (distinct), không theo tiết.
     * 1 ngày = KHONG_PHEP nếu có BẤT KỲ tiết nào vắng không phép.
     * 1 ngày = CO_PHEP nếu có tiết vắng có phép (và không có tiết không phép).
     * Học sinh không có bản ghi = đi học đầy đủ (0% vắng).
     */
    public Map<String, Object> getStatistics(Integer lopId, LocalDate from, LocalDate to) {
        if (lopId == null) throw new ApiException("Thiếu mã lớp");

        // Total school days (Mon-Sat) in the date range
        long totalDays = countSchoolDays(from, to);

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
            double rate = totalDays > 0 ? Math.round((1.0 - (double) totalAbsent / totalDays) * 10000) / 100.0 : 100.0;

            Map<String, Object> item = new HashMap<>();
            item.put("hocSinhId", hsId);
            item.put("hoTen", entry.getValue());
            item.put("coPhep", coPhep);
            item.put("khongPhep", khongPhep);
            item.put("tongVang", totalAbsent);
            item.put("tongNgayHoc", totalDays);
            item.put("tyLeChuyenCan", rate);
            studentStats.add(item);
        }

        // Sort by absence count descending
        studentStats.sort((a, b) -> Long.compare(
            ((Number) b.get("tongVang")).longValue(),
            ((Number) a.get("tongVang")).longValue()));

        Map<String, Object> result = new HashMap<>();
        result.put("tongNgayHoc", totalDays);
        result.put("lopId", lopId);
        result.put("tuNgay", from);
        result.put("denNgay", to);
        result.put("hocSinh", studentStats);
        return result;
    }

    /**
     * Thong ke chuyen can cho mot hoc sinh.
     * Tính theo NGÀY (distinct), không theo tiết.
     * Giáo viên chỉ lưu bản ghi cho HS vắng; HS đi học không có bản ghi.
     * → coMat = tongNgayHoc - coPhep - khongPhep (ngày không có bản ghi = đi học).
     */
    public Map<String, Object> getStudentStatistics(Integer hocSinhId, LocalDate from, LocalDate to) {
        if (hocSinhId == null) throw new ApiException("Thiếu mã học sinh");

        // Total school days (Mon-Sat) in the date range
        long tongNgayHoc = countSchoolDays(from, to);

        // Fetch all records for this student in date range
        List<DiemDanh> allRecords = repository.findByHocSinhIdAndNgayBetween(hocSinhId, from, to);

        // Group by date → determine worst status per day
        // Chỉ ghi nhận ngày vắng (CO_PHEP / KHONG_PHEP); bỏ qua CO_MAT
        Map<LocalDate, String> dayAbsence = new TreeMap<>(Comparator.reverseOrder());
        Map<LocalDate, List<String>> dayGhiChu = new TreeMap<>(Comparator.reverseOrder());

        for (DiemDanh d : allRecords) {
            LocalDate ngay = d.getNgay();
            String lv = d.getLoaiVang();

            // Chỉ quan tâm bản ghi vắng
            if (!"CO_PHEP".equals(lv) && !"KHONG_PHEP".equals(lv)) {
                // CO_MAT → ghi chú nếu có, nhưng không đánh dấu vắng
                if (d.getGhiChu() != null && !d.getGhiChu().isBlank()) {
                    dayGhiChu.computeIfAbsent(ngay, k -> new ArrayList<>()).add(d.getGhiChu());
                }
                continue;
            }

            String current = dayAbsence.getOrDefault(ngay, null);
            // KHONG_PHEP ưu tiên hơn CO_PHEP
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

        // coMat = tổng ngày học - ngày vắng (ngày không có bản ghi = đi học)
        long coMat = Math.max(0, tongNgayHoc - coPhep - khongPhep);
        long totalForRate = tongNgayHoc > 0 ? tongNgayHoc : (coMat + coPhep + khongPhep);
        double rate = totalForRate > 0 ? Math.round((double) coMat / totalForRate * 10000) / 100.0 : 100.0;

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
        result.put("tongNgayHoc", tongNgayHoc);
        result.put("totalDays", totalForRate);
        result.put("present", coMat);
        result.put("excusedAbsent", coPhep);
        result.put("unexcusedAbsent", khongPhep);
        result.put("late", 0);
        result.put("coMat", coMat);
        result.put("coPhep", coPhep);
        result.put("khongPhep", khongPhep);
        result.put("tongNgay", totalForRate);
        result.put("tyLeChuyenCan", rate);
        result.put("details", details);
        return result;
    }
}
