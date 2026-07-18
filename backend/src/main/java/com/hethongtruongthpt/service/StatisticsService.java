package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.statistics.AcademicStatistics;
import com.hethongtruongthpt.dto.statistics.AttendanceStatistics;
import com.hethongtruongthpt.dto.statistics.ConductStatistics;
import com.hethongtruongthpt.dto.statistics.OverviewStatistics;
import com.hethongtruongthpt.entity.HanhKiem;
import com.hethongtruongthpt.entity.HocBa;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.repository.DiemDanhRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.HanhKiemRepository;
import com.hethongtruongthpt.repository.HocBaRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.NamHocRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private final HocSinhRepository hocSinhRepository;
    private final GiaoVienRepository giaoVienRepository;
    private final LopHocRepository lopHocRepository;
    private final HocBaRepository hocBaRepository;
    private final DiemDanhRepository diemDanhRepository;
    private final HanhKiemRepository hanhKiemRepository;
    private final NamHocRepository namHocRepository;

    public StatisticsService(HocSinhRepository hocSinhRepository,
                             GiaoVienRepository giaoVienRepository,
                             LopHocRepository lopHocRepository,
                             HocBaRepository hocBaRepository,
                             DiemDanhRepository diemDanhRepository,
                             HanhKiemRepository hanhKiemRepository,
                             NamHocRepository namHocRepository) {
        this.hocSinhRepository = hocSinhRepository;
        this.giaoVienRepository = giaoVienRepository;
        this.lopHocRepository = lopHocRepository;
        this.hocBaRepository = hocBaRepository;
        this.diemDanhRepository = diemDanhRepository;
        this.hanhKiemRepository = hanhKiemRepository;
        this.namHocRepository = namHocRepository;
    }

    // ----------------------------------------------------------------
    //  OVERVIEW
    // ----------------------------------------------------------------

    public OverviewStatistics getOverview(String namHoc) {
        if (namHoc == null || namHoc.isBlank()) {
            throw new ApiException("Năm học không được để trống");
        }

        OverviewStatistics stats = new OverviewStatistics();

        // Count active students (trangThai = 1)
        stats.setTongHocSinh((int) hocSinhRepository.countByTrangThai(1));

        // Count all teachers
        stats.setTongGiaoVien((int) giaoVienRepository.count());

        // Get classes for this school year
        List<LopHoc> lopList = lopHocRepository.findByNamHoc(namHoc);
        stats.setTongLop(lopList.size());

        // Group classes by khoi (grade 10, 11, 12)
        Map<Integer, OverviewStatistics.KhoiStats> theoKhoi = new LinkedHashMap<>();
        for (int khoi = 10; khoi <= 12; khoi++) {
            theoKhoi.put(khoi, new OverviewStatistics.KhoiStats(0, 0));
        }
        for (LopHoc lop : lopList) {
            Integer khoi = lop.getKhoi();
            OverviewStatistics.KhoiStats existing = theoKhoi.getOrDefault(khoi,
                    new OverviewStatistics.KhoiStats(0, 0));
            existing.setSoLop(existing.getSoLop() + 1);
            existing.setSiSo(existing.getSiSo() + (lop.getSiSo() != null ? lop.getSiSo() : 0));
            theoKhoi.put(khoi, existing);
        }
        stats.setTheoKhoi(theoKhoi);

        return stats;
    }

    // ----------------------------------------------------------------
    //  ACADEMIC
    // ----------------------------------------------------------------

    public AcademicStatistics getAcademicStats(String namHoc, Integer khoi, Integer lopId) {
        if (namHoc == null || namHoc.isBlank()) {
            throw new ApiException("Năm học không được để trống");
        }

        NamHoc nh = namHocRepository.findByTenNamHoc(namHoc)
                .orElseThrow(() -> new ApiException("Không tìm thấy năm học: " + namHoc));

        List<HocBa> hocBaList;

        if (lopId != null) {
            // Filter by specific class
            hocBaList = hocBaRepository.findByHocSinhLopId(lopId).stream()
                    .filter(hb -> hb.getNamHoc() != null && hb.getNamHoc().getId().equals(nh.getId()))
                    .collect(Collectors.toList());
        } else if (khoi != null) {
            // Filter by grade across all classes
            hocBaList = hocBaRepository.findByNamHocId(nh.getId()).stream()
                    .filter(hb -> hb.getHocSinh().getLop() != null
                            && hb.getHocSinh().getLop().getKhoi() != null
                            && hb.getHocSinh().getLop().getKhoi().equals(khoi))
                    .collect(Collectors.toList());
        } else {
            // All students for this school year
            hocBaList = hocBaRepository.findByNamHocId(nh.getId());
        }

        AcademicStatistics stats = new AcademicStatistics();
        stats.setTongHocSinh(hocBaList.size());

        // Calculate school-wide average score
        BigDecimal totalDiem = BigDecimal.ZERO;
        int countDiem = 0;
        for (HocBa hb : hocBaList) {
            if (hb.getDiemTBCaNam() != null) {
                totalDiem = totalDiem.add(hb.getDiemTBCaNam());
                countDiem++;
            }
        }
        if (countDiem > 0) {
            double avg = totalDiem.divide(BigDecimal.valueOf(countDiem), 2, RoundingMode.HALF_UP)
                    .doubleValue();
            stats.setDiemTBToanTruong(avg);
        }

        // Classify students by academic performance (hocLuc)
        Map<String, Long> phanLoai = hocBaList.stream()
                .filter(hb -> hb.getHocLuc() != null && !hb.getHocLuc().isBlank())
                .collect(Collectors.groupingBy(HocBa::getHocLuc, Collectors.counting()));
        stats.setPhanLoaiHocLuc(phanLoai);

        // Top 10 students by average score
        List<AcademicStatistics.TopStudent> topStudents = hocBaList.stream()
                .filter(hb -> hb.getDiemTBCaNam() != null && hb.getHocSinh() != null)
                .sorted(Comparator.comparing((HocBa hb) -> hb.getDiemTBCaNam()).reversed())
                .limit(10)
                .map(hb -> new AcademicStatistics.TopStudent(
                        hb.getHocSinh().getHoTen(),
                        hb.getHocSinh().getLop() != null ? hb.getHocSinh().getLop().getTenLop() : "",
                        hb.getDiemTBCaNam().setScale(2, RoundingMode.HALF_UP).doubleValue()))
                .collect(Collectors.toList());
        stats.setTopStudents(topStudents);

        return stats;
    }

    // ----------------------------------------------------------------
    //  ATTENDANCE
    // ----------------------------------------------------------------

    public AttendanceStatistics getAttendanceStats(String namHoc, LocalDate from, LocalDate to) {
        if (namHoc == null || namHoc.isBlank()) {
            throw new ApiException("Năm học không được để trống");
        }

        NamHoc nh = namHocRepository.findByTenNamHoc(namHoc)
                .orElseThrow(() -> new ApiException("Không tìm thấy năm học: " + namHoc));

        // Default date range: full school year
        LocalDate effectiveFrom = (from != null) ? from : nh.getNgayBatDauHk1();
        LocalDate effectiveTo = (to != null) ? to : nh.getNgayKetThucHk2();

        List<LopHoc> lopList = lopHocRepository.findByNamHoc(namHoc);

        // Aggregate absence records per student across all classes
        // Key: hocSinhId, Value: AbsentStudent accumulator
        Map<Integer, AttendanceStatistics.AbsentStudent> studentMap = new HashMap<>();
        List<AttendanceStatistics.ClassAttendance> classAttendanceList = new ArrayList<>();
        long totalAbsenceRecords = 0;
        long totalAllRecords = 0;

        for (LopHoc lop : lopList) {
            // Absence stats grouped by student for this class
            // row[0]=hocSinhId, row[1]=hoTen, row[2]=coPhep, row[3]=khongPhep, row[4]=totalRecords
            List<Object[]> absenceRows = diemDanhRepository
                    .getAbsenceStatsByLop(lop.getId(), effectiveFrom, effectiveTo);

            long classCoPhep = 0;
            long classKhongPhep = 0;
            long classTotalRecords = 0;

            for (Object[] row : absenceRows) {
                Integer hocSinhId = ((Number) row[0]).intValue();
                String hoTen = (String) row[1];
                long coPhep = ((Number) row[2]).longValue();
                long khongPhep = ((Number) row[3]).longValue();
                long totalRecords = ((Number) row[4]).longValue();

                totalAbsenceRecords += (coPhep + khongPhep);
                totalAllRecords += totalRecords;
                classCoPhep += coPhep;
                classKhongPhep += khongPhep;
                classTotalRecords += totalRecords;

                studentMap.merge(hocSinhId,
                        new AttendanceStatistics.AbsentStudent(hocSinhId, hoTen, lop.getTenLop(),
                                coPhep + khongPhep, coPhep, khongPhep),
                        (existing, incoming) -> {
                            existing.setSoNgayVang(existing.getSoNgayVang() + incoming.getSoNgayVang());
                            existing.setCoPhep(existing.getCoPhep() + incoming.getCoPhep());
                            existing.setKhongPhep(existing.getKhongPhep() + incoming.getKhongPhep());
                            if (incoming.getSoNgayVang() > 0) {
                                existing.setTenLop(incoming.getTenLop());
                            }
                            return existing;
                        });
            }

            // Per-class attendance
            long classTongVang = classCoPhep + classKhongPhep;
            double classTyLeVang = classTotalRecords > 0
                    ? Math.round((double) classTongVang / classTotalRecords * 10000) / 100.0
                    : 0;
            classAttendanceList.add(new AttendanceStatistics.ClassAttendance(
                    lop.getTenLop(),
                    lop.getSiSo() != null ? lop.getSiSo() : 0,
                    classTongVang, classCoPhep, classKhongPhep, classTyLeVang));
        }

        AttendanceStatistics stats = new AttendanceStatistics();
        stats.setTongNgayVang(totalAbsenceRecords);
        stats.setTheoLop(classAttendanceList);

        // Absence rate = total absence records / total attendance records * 100
        if (totalAllRecords > 0) {
            double rate = (double) totalAbsenceRecords / totalAllRecords * 100.0;
            stats.setTyLeVang(Math.round(rate * 100.0) / 100.0);
        }

        // Top 10 students with most absences
        List<AttendanceStatistics.AbsentStudent> topList = studentMap.values().stream()
                .sorted(Comparator.comparingLong(AttendanceStatistics.AbsentStudent::getSoNgayVang).reversed())
                .limit(10)
                .collect(Collectors.toList());
        stats.setTopVangNhat(topList);

        return stats;
    }

    // ----------------------------------------------------------------
    //  CONDUCT
    // ----------------------------------------------------------------

    public ConductStatistics getConductStats(String namHoc, Integer hocKy) {
        if (namHoc == null || namHoc.isBlank()) {
            throw new ApiException("Năm học không được để trống");
        }

        NamHoc nh = namHocRepository.findByTenNamHoc(namHoc)
                .orElseThrow(() -> new ApiException("Không tìm thấy năm học: " + namHoc));

        List<LopHoc> lopList = lopHocRepository.findByNamHoc(namHoc);

        // Overall conduct distribution
        Map<String, Long> phanBo = new HashMap<>();
        phanBo.put("TOT", 0L);
        phanBo.put("KHA", 0L);
        phanBo.put("TRUNG_BINH", 0L);
        phanBo.put("YEU", 0L);

        // Per-class conduct tracking
        // Key: tenLop, Value: [totCount, khaiCount, trungBinhCount, yeuCount, totalCount]
        Map<String, long[]> classConductMap = new HashMap<>();

        // Track unique students to avoid double counting across classes/semesters
        Map<Integer, HanhKiem> globalLatestHkMap = new HashMap<>();

        for (LopHoc lop : lopList) {
            List<HanhKiem> hkList = hanhKiemRepository
                    .findByHocSinhLopIdAndNamHocId(lop.getId(), nh.getId());

            // Filter by hocKy if specified; otherwise use ALL semesters for deduplication
            Map<Integer, HanhKiem> latestHkMap = new HashMap<>();
            for (HanhKiem hk : hkList) {
                if (hk.getHocSinh() == null) continue;
                // If hocKy filter is set, only include matching semester
                if (hocKy != null && hk.getHocKy() != null && !hk.getHocKy().equals(hocKy)) {
                    continue;
                }
                Integer studentId = hk.getHocSinh().getId();
                HanhKiem existing = latestHkMap.get(studentId);
                // Keep latest semester (or the specific one if filtered)
                if (existing == null || hk.getHocKy() > existing.getHocKy()) {
                    latestHkMap.put(studentId, hk);
                }
            }

            // Merge into global map to deduplicate across classes (student may have moved)
            for (Map.Entry<Integer, HanhKiem> entry : latestHkMap.entrySet()) {
                Integer studentId = entry.getKey();
                HanhKiem hk = entry.getValue();
                HanhKiem existingGlobal = globalLatestHkMap.get(studentId);
                if (existingGlobal == null || hk.getHocKy() > existingGlobal.getHocKy()) {
                    globalLatestHkMap.put(studentId, hk);
                }
            }

            // Per-class counts for best/worst class tracking
            long totCount = 0, khaiCount = 0, trungBinhCount = 0, yeuCount = 0;
            for (HanhKiem hk : latestHkMap.values()) {
                if (hk.getXepLoai() == null) continue;
                switch (hk.getXepLoai()) {
                    case TOT: totCount++; break;
                    case KHA: khaiCount++; break;
                    case TRUNG_BINH: trungBinhCount++; break;
                    case YEU: yeuCount++; break;
                    default: break;
                }
            }
            long total = totCount + khaiCount + trungBinhCount + yeuCount;
            if (total > 0) {
                classConductMap.put(lop.getTenLop(),
                        new long[]{totCount, khaiCount, trungBinhCount, yeuCount, total});
            }
        }

        // Build global distribution from deduplicated student map
        for (HanhKiem hk : globalLatestHkMap.values()) {
            if (hk.getXepLoai() == null) continue;
            switch (hk.getXepLoai()) {
                case TOT: phanBo.merge("TOT", 1L, Long::sum); break;
                case KHA: phanBo.merge("KHA", 1L, Long::sum); break;
                case TRUNG_BINH: phanBo.merge("TRUNG_BINH", 1L, Long::sum); break;
                case YEU: phanBo.merge("YEU", 1L, Long::sum); break;
                default: break;
            }
        }

        ConductStatistics stats = new ConductStatistics();
        stats.setPhanBoHanhKiem(phanBo);

        // Find best class (highest TOT ratio)
        String bestClass = null;
        double bestRatio = -1.0;
        for (Map.Entry<String, long[]> entry : classConductMap.entrySet()) {
            long total = entry.getValue()[4];
            if (total > 0) {
                double totRatio = (double) entry.getValue()[0] / total;
                if (totRatio > bestRatio) {
                    bestRatio = totRatio;
                    bestClass = entry.getKey();
                }
            }
        }
        stats.setLopTotNhat(bestClass);

        // Find worst class (highest YEU ratio)
        String worstClass = null;
        double worstRatio = -1.0;
        for (Map.Entry<String, long[]> entry : classConductMap.entrySet()) {
            long total = entry.getValue()[4];
            if (total > 0) {
                double yeuRatio = (double) entry.getValue()[3] / total;
                if (yeuRatio > worstRatio) {
                    worstRatio = yeuRatio;
                    worstClass = entry.getKey();
                }
            }
        }
        stats.setLopYeuNhat(worstClass);

        return stats;
    }
}
