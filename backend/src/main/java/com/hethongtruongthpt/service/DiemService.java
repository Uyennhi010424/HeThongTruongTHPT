package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.entity.DiemAuditLog;
import com.hethongtruongthpt.entity.AdminConfig;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.DiemAuditLogRepository;
import com.hethongtruongthpt.repository.DiemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DiemService {
    private static final Logger logger = LoggerFactory.getLogger(DiemService.class);
    private final DiemRepository diemRepository;
    private final DiemAuditLogRepository diemAuditLogRepository;
    private final AdminConfigService adminConfigService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private static final List<String> VALID_LOAI_DIEM = Arrays.asList("TX", "GK", "CK");
    private static final BigDecimal MIN_SCORE = BigDecimal.ZERO;
    private static final BigDecimal MAX_SCORE = BigDecimal.TEN;

    public DiemService(DiemRepository diemRepository, 
                       DiemAuditLogRepository diemAuditLogRepository,
                       AdminConfigService adminConfigService,
                       com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.diemRepository = diemRepository;
        this.diemAuditLogRepository = diemAuditLogRepository;
        this.adminConfigService = adminConfigService;
        this.objectMapper = objectMapper;
    }

    private void validateDiem(Diem diem) {
        if (diem.getGiaTriDiem() != null) {
            if (diem.getGiaTriDiem().compareTo(MIN_SCORE) < 0 || diem.getGiaTriDiem().compareTo(MAX_SCORE) > 0) {
                throw new IllegalArgumentException("Điểm phải trong khoảng 0-10");
            }
        }
        if (diem.getLoaiDiem() != null && !VALID_LOAI_DIEM.contains(diem.getLoaiDiem().toUpperCase())) {
            throw new IllegalArgumentException("Loại điểm phải là TX, GK hoặc CK");
        }
        if (diem.getHocKy() != null && (diem.getHocKy() < 1 || diem.getHocKy() > 2)) {
            throw new IllegalArgumentException("Học kỳ phải là 1 hoặc 2");
        }
    }

    public List<Diem> getAll() {
        return diemRepository.findAll();
    }

    public List<Diem> getByHocKyAndNamHoc(Integer hocKy, String namHoc) {
        return diemRepository.findByHocKyAndNamHoc(hocKy, namHoc);
    }

    public List<Diem> getByNamHoc(String namHoc) {
        return diemRepository.findByNamHoc(namHoc);
    }

    public List<Diem> getByHocSinhId(Integer hocSinhId) {
        return diemRepository.findByHocSinhId(hocSinhId);
    }

    public long deleteByNamHocAndHocKy(String namHoc, Integer hocKy) {
        List<Diem> list;
        if (hocKy != null && hocKy > 0) {
            list = diemRepository.findByHocKyAndNamHoc(hocKy, namHoc);
        } else {
            list = diemRepository.findByNamHoc(namHoc);
        }
        long count = list.size();
        if (count > 0) {
            diemRepository.deleteAll(list);
        }
        return count;
    }

    public List<Map<String, Object>> getSummaryByNamHoc(String namHoc) {
        return convertSummary(diemRepository.findSummaryByNamHoc(namHoc));
    }

    public List<Map<String, Object>> getSummaryByNamHocAndLopId(String namHoc, Integer lopId) {
        return convertSummary(diemRepository.findSummaryByNamHocAndLopId(namHoc, lopId));
    }

    public List<Map<String, Object>> getSummaryByNamHocAndHocKy(String namHoc, Integer hocKy) {
        return convertSummary(diemRepository.findSummaryByNamHocAndHocKy(namHoc, hocKy));
    }

    public List<Map<String, Object>> getSummaryAll() {
        return convertSummary(diemRepository.findSummaryAll());
    }

    private List<Map<String, Object>> convertSummary(List<Map<String, Object>> raw) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (raw.isEmpty()) {
            logger.warn("convertSummary: raw query trả về 0 rows!");
        } else {
            logger.info("convertSummary: {} rows, sample keys: {}", raw.size(), raw.get(0).keySet());
        }
        for (Map<String, Object> row : raw) {
            Map<String, Object> item = new HashMap<>();
            // Native query trả snake_case keys (tên cột gốc).
            // getVal dùng equalsIgnoreCase nên match cả snake_case lẫn camelCase.
            item.put("hocSinhId", getVal(row, "hoc_sinh_id", "hocSinhId", "hocsinhid"));
            item.put("monHocId", getVal(row, "mon_hoc_id", "monHocId", "monhocid"));
            item.put("loaiDiem", getVal(row, "loai_diem", "loaiDiem", "loaidiem"));
            item.put("soThuTu", getVal(row, "so_thu_tu", "soThuTu", "sothutu"));
            item.put("hocKy", getVal(row, "hoc_ky", "hocKy", "hocky"));
            item.put("namHoc", getVal(row, "nam_hoc", "namHoc", "namhoc"));
            Object giaTri = getVal(row, "gia_tri", "giaTriDiem", "giatridiem");
            if (giaTri != null) {
                try {
                    double val = Double.parseDouble(giaTri.toString());
                    // Làm tròn 2 chữ số thập phân
                    val = Math.round(val * 100.0) / 100.0;
                    item.put("giaTriDiem", new java.math.BigDecimal(String.valueOf(val)));
                } catch (Exception e) {
                    item.put("giaTriDiem", new java.math.BigDecimal(giaTri.toString()));
                }
            } else {
                item.put("giaTriDiem", null);
            }
            item.put("nhanXet", getVal(row, "nhan_xet", "nhanXet", "nhanxet"));
            // lopId & khoi dùng để frontend xác định khối khi student.lop chưa populate
            item.put("lopId", getVal(row, "lop_id", "lopId", "lopid"));
            Object khoiVal = getVal(row, "khoi", "KHOI");
            if (khoiVal != null) {
                try {
                    item.put("khoi", Integer.parseInt(khoiVal.toString()));
                } catch (NumberFormatException ignored) {
                    item.put("khoi", khoiVal);
                }
            }
            result.add(item);
        }
        return result;
    }

    /** Lấy giá trị từ map, thử nhiều key khác nhau */
    private Object getVal(Map<String, Object> row, String... keys) {
        for (String key : keys) {
            Object val = row.get(key);
            if (val != null) return val;
        }
        // Thử tìm key không phân biệt hoa thường
        for (String key : keys) {
            for (Map.Entry<String, Object> entry : row.entrySet()) {
                if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(key) && entry.getValue() != null) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    /**
     * Tính ĐTB theo khối trực tiếp trên server (nhanh hơn tải 67k records).
     * Trả về [{khoi: 10, avgScore: 7.5, studentCount: 150}, ...]
     */
    public List<Map<String, Object>> getAvgByGrade(String namHoc) {
        String effectiveNamHoc = (namHoc != null && !namHoc.isBlank()) ? namHoc : getDefaultNamHoc();
        List<Map<String, Object>> summary = getSummaryByNamHoc(effectiveNamHoc);

        // Gom điểm theo cấu trúc: studentId -> monId -> semester -> list of double[]{score, scoreType}
        Map<String, Map<String, Map<Integer, List<double[]>>>> studentSubjectSemesterScores = new HashMap<>();
        Map<String, Integer> studentGrade = new HashMap<>();

        for (Map<String, Object> item : summary) {
            Object studentIdObj = getVal(item, "hoc_sinh_id", "hocSinhId");
            Object scoreObj = getVal(item, "gia_tri", "giaTriDiem");
            Object khoiObj = getVal(item, "khoi");
            Object loaiDiemObj = getVal(item, "loai_diem", "loaiDiem");
            Object hocKyObj = getVal(item, "hoc_ky", "hocKy");
            Object monHocIdObj = getVal(item, "mon_hoc_id", "monHocId");

            if (studentIdObj == null || scoreObj == null) continue;

            double score;
            try { score = Double.parseDouble(scoreObj.toString()); } catch (NumberFormatException e) { continue; }

            String studentId = String.valueOf(studentIdObj);
            String loaiDiem = loaiDiemObj != null ? loaiDiemObj.toString().toUpperCase() : "";
            int hocKy = hocKyObj != null ? Integer.parseInt(hocKyObj.toString()) : 1;
            String monId = monHocIdObj != null ? monHocIdObj.toString() : "0";

            double scoreType = 1.0; // TX
            if ("GK".equals(loaiDiem)) scoreType = 2.0;
            else if ("CK".equals(loaiDiem)) scoreType = 3.0;

            studentSubjectSemesterScores
                .computeIfAbsent(studentId, k -> new HashMap<>())
                .computeIfAbsent(monId, k -> new HashMap<>())
                .computeIfAbsent(hocKy, k -> new ArrayList<>())
                .add(new double[]{score, scoreType});

            if (khoiObj != null && !studentGrade.containsKey(studentId)) {
                try { studentGrade.put(studentId, Integer.parseInt(khoiObj.toString())); } catch (NumberFormatException ignored) {}
            }
        }

        // Tính ĐTB từng học sinh và gom theo khối lớp
        Map<Integer, List<Double>> avgByGrade = new HashMap<>();
        avgByGrade.put(10, new ArrayList<>());
        avgByGrade.put(11, new ArrayList<>());
        avgByGrade.put(12, new ArrayList<>());

        for (Map.Entry<String, Map<String, Map<Integer, List<double[]>>>> studentEntry : studentSubjectSemesterScores.entrySet()) {
            String studentId = studentEntry.getKey();
            Map<String, Map<Integer, List<double[]>>> subjectMap = studentEntry.getValue();
            if (subjectMap.isEmpty()) continue;

            List<Double> studentSubjectAverages = new ArrayList<>();

            for (Map.Entry<String, Map<Integer, List<double[]>>> subjectEntry : subjectMap.entrySet()) {
                Map<Integer, List<double[]>> semesterMap = subjectEntry.getValue();

                Double avg1 = null;
                Double avg2 = null;

                List<double[]> scores1 = semesterMap.get(1);
                if (scores1 != null && !scores1.isEmpty()) {
                    double sumTx = 0, gk = 0, ck = 0;
                    boolean hasGk = false, hasCk = false;
                    int txCount = 0;
                    for (double[] s : scores1) {
                        if (s[1] == 1.0) { sumTx += s[0]; txCount++; }
                        else if (s[1] == 2.0) { gk = s[0]; hasGk = true; }
                        else if (s[1] == 3.0) { ck = s[0]; hasCk = true; }
                    }
                    if (hasGk && hasCk) {
                        avg1 = (sumTx + 2 * gk + 3 * ck) / (txCount + 5);
                    }
                }

                List<double[]> scores2 = semesterMap.get(2);
                if (scores2 != null && !scores2.isEmpty()) {
                    double sumTx = 0, gk = 0, ck = 0;
                    boolean hasGk = false, hasCk = false;
                    int txCount = 0;
                    for (double[] s : scores2) {
                        if (s[1] == 1.0) { sumTx += s[0]; txCount++; }
                        else if (s[1] == 2.0) { gk = s[0]; hasGk = true; }
                        else if (s[1] == 3.0) { ck = s[0]; hasCk = true; }
                    }
                    if (hasGk && hasCk) {
                        avg2 = (sumTx + 2 * gk + 3 * ck) / (txCount + 5);
                    }
                }

                if (avg1 != null && avg2 != null) {
                    studentSubjectAverages.add((avg1 + 2 * avg2) / 3.0);
                } else if (avg1 != null) {
                    studentSubjectAverages.add(avg1);
                } else if (avg2 != null) {
                    studentSubjectAverages.add(avg2);
                }
            }

            if (!studentSubjectAverages.isEmpty()) {
                double yearAvg = studentSubjectAverages.stream().mapToDouble(Double::doubleValue).average().orElse(0);
                Integer grade = studentGrade.get(studentId);
                if (grade != null && avgByGrade.containsKey(grade)) {
                    avgByGrade.get(grade).add(yearAvg);
                }
            }
        }

        // Tính trung bình theo khối
        List<Map<String, Object>> result = new ArrayList<>();
        for (int grade : new int[]{10, 11, 12}) {
            List<Double> values = avgByGrade.get(grade);
            Map<String, Object> item = new HashMap<>();
            item.put("khoi", grade);
            item.put("studentCount", values.size());
            if (values.isEmpty()) {
                item.put("avgScore", null);
            } else {
                double avg = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
                item.put("avgScore", Math.round(avg * 100.0) / 100.0);
            }
            result.add(item);
        }
        return result;
    }

    /**
     * Phân bố xếp loại (Giỏi/Khá/TB/Yếu/Kém).
     * Tính từ average từng học sinh, không phải average theo khối.
     */
    public Map<String, Object> getDistribution(String namHoc, Integer hocKy, Integer khoi) {
        String effectiveNamHoc = (namHoc != null && !namHoc.isBlank()) ? namHoc : getDefaultNamHoc();
        List<Map<String, Object>> summary = getSummaryByNamHoc(effectiveNamHoc);

        // Group scores: studentId -> monId -> semester -> list of double[]{score, scoreType}
        Map<String, Map<String, Map<Integer, List<double[]>>>> studentSubjectSemesterScores = new HashMap<>();

        for (Map<String, Object> item : summary) {
            Object studentIdObj = getVal(item, "hoc_sinh_id", "hocSinhId");
            Object scoreObj = getVal(item, "gia_tri", "giaTriDiem");
            Object loaiDiemObj = getVal(item, "loai_diem", "loaiDiem");
            Object hocKyObj = getVal(item, "hoc_ky", "hocKy");
            Object monHocIdObj = getVal(item, "mon_hoc_id", "monHocId");
            Object itemKhoiObj = getVal(item, "khoi", "khoi");

            if (studentIdObj == null || scoreObj == null) continue;

            // Filter by khoi if provided
            if (khoi != null && khoi != 0) {
                if (itemKhoiObj != null) {
                    int itemKhoi = Integer.parseInt(itemKhoiObj.toString());
                    if (itemKhoi != khoi) continue;
                }
            }

            double score;
            try { score = Double.parseDouble(scoreObj.toString()); } catch (NumberFormatException e) { continue; }

            String studentId = String.valueOf(studentIdObj);
            String loaiDiem = loaiDiemObj != null ? loaiDiemObj.toString().toUpperCase() : "";
            int itemHocKy = hocKyObj != null ? Integer.parseInt(hocKyObj.toString()) : 1;

            // Filter by hocKy if provided
            if (hocKy != null && hocKy != 0) {
                if (itemHocKy != hocKy) continue;
            }

            String monId = monHocIdObj != null ? monHocIdObj.toString() : "0";

            double scoreType = 1.0; // TX
            if ("GK".equals(loaiDiem)) scoreType = 2.0;
            else if ("CK".equals(loaiDiem)) scoreType = 3.0;

            studentSubjectSemesterScores
                .computeIfAbsent(studentId, k -> new HashMap<>())
                .computeIfAbsent(monId, k -> new HashMap<>())
                .computeIfAbsent(itemHocKy, k -> new ArrayList<>())
                .add(new double[]{score, scoreType});
        }

        List<Double> studentFinalGPAs = new ArrayList<>();

        for (Map.Entry<String, Map<String, Map<Integer, List<double[]>>>> studentEntry : studentSubjectSemesterScores.entrySet()) {
            Map<String, Map<Integer, List<double[]>>> subjectMap = studentEntry.getValue();
            if (subjectMap.isEmpty()) continue;

            List<Double> studentSubjectAverages = new ArrayList<>();

            for (Map.Entry<String, Map<Integer, List<double[]>>> subjectEntry : subjectMap.entrySet()) {
                Map<Integer, List<double[]>> semesterMap = subjectEntry.getValue();

                if (hocKy != null && hocKy != 0) {
                    // Specific semester average
                    List<double[]> scores = semesterMap.get(hocKy);
                    if (scores != null && !scores.isEmpty()) {
                        double sumTx = 0, gk = 0, ck = 0;
                        boolean hasGk = false, hasCk = false;
                        int txCount = 0;
                        for (double[] s : scores) {
                            if (s[1] == 1.0) { sumTx += s[0]; txCount++; }
                            else if (s[1] == 2.0) { gk = s[0]; hasGk = true; }
                            else if (s[1] == 3.0) { ck = s[0]; hasCk = true; }
                        }
                        if (hasGk && hasCk) {
                            double subjectSemesterAvg = (sumTx + 2 * gk + 3 * ck) / (txCount + 5);
                            studentSubjectAverages.add(subjectSemesterAvg);
                        }
                    }
                } else {
                    // Cả năm average
                    Double avg1 = null;
                    Double avg2 = null;

                    List<double[]> scores1 = semesterMap.get(1);
                    if (scores1 != null && !scores1.isEmpty()) {
                        double sumTx = 0, gk = 0, ck = 0;
                        boolean hasGk = false, hasCk = false;
                        int txCount = 0;
                        for (double[] s : scores1) {
                            if (s[1] == 1.0) { sumTx += s[0]; txCount++; }
                            else if (s[1] == 2.0) { gk = s[0]; hasGk = true; }
                            else if (s[1] == 3.0) { ck = s[0]; hasCk = true; }
                        }
                        if (hasGk && hasCk) {
                            avg1 = (sumTx + 2 * gk + 3 * ck) / (txCount + 5);
                        }
                    }

                    List<double[]> scores2 = semesterMap.get(2);
                    if (scores2 != null && !scores2.isEmpty()) {
                        double sumTx = 0, gk = 0, ck = 0;
                        boolean hasGk = false, hasCk = false;
                        int txCount = 0;
                        for (double[] s : scores2) {
                            if (s[1] == 1.0) { sumTx += s[0]; txCount++; }
                            else if (s[1] == 2.0) { gk = s[0]; hasGk = true; }
                            else if (s[1] == 3.0) { ck = s[0]; hasCk = true; }
                        }
                        if (hasGk && hasCk) {
                            avg2 = (sumTx + 2 * gk + 3 * ck) / (txCount + 5);
                        }
                    }

                    if (avg1 != null && avg2 != null) {
                        studentSubjectAverages.add((avg1 + 2 * avg2) / 3.0);
                    } else if (avg1 != null) {
                        studentSubjectAverages.add(avg1);
                    } else if (avg2 != null) {
                        studentSubjectAverages.add(avg2);
                    }
                }
            }

            if (!studentSubjectAverages.isEmpty()) {
                double gpa = studentSubjectAverages.stream().mapToDouble(Double::doubleValue).average().orElse(0);
                studentFinalGPAs.add(gpa);
            }
        }

        int totalStudents = studentFinalGPAs.size();

        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("TOT", 0);
        counts.put("KHA", 0);
        counts.put("DAT", 0);
        counts.put("CHUA_DAT", 0);

        double totalAvg = 0;
        for (double gpa : studentFinalGPAs) {
            totalAvg += gpa;
            if (gpa >= 8.0) {
                counts.merge("TOT", 1, Integer::sum);
            } else if (gpa >= 6.5) {
                counts.merge("KHA", 1, Integer::sum);
            } else if (gpa >= 5.0) {
                counts.merge("DAT", 1, Integer::sum);
            } else {
                counts.merge("CHUA_DAT", 1, Integer::sum);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("counts", counts);
        result.put("total", totalStudents);
        result.put("avgScore", totalStudents > 0 ?
            Math.round((totalAvg / totalStudents) * 100.0) / 100.0 : null);
        return result;
    }

    private String getDefaultNamHoc() {
        java.time.LocalDate now = java.time.LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        return month >= 9 ? year + "-" + (year + 1) : (year - 1) + "-" + year;
    }
    public List<Diem> getByGiaoVienNhapIdAndHocKyAndNamHoc(Integer giaoVienNhapId, Integer hocKy, String namHoc) {
        return diemRepository.findByGiaoVienNhapIdAndHocKyAndNamHoc(giaoVienNhapId, hocKy, namHoc);
    }

    public List<Diem> getByGiaoVienNhapIdAndNamHoc(Integer giaoVienNhapId, String namHoc) {
        return diemRepository.findByGiaoVienNhapIdAndNamHoc(giaoVienNhapId, namHoc);
    }

    public Diem getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return diemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy điểm"));
    }

    @Transactional
    public Diem create(Diem diem) {
        if (diem == null) throw new IllegalArgumentException("Điểm không được để trống");
        validateDiem(diem);
        Diem saved = diemRepository.save(diem);
        createAuditLog(saved, null, saved.getGiaTriDiem(), "INSERT");
        return saved;
    }

    @Transactional
    public Diem update(Integer id, Diem diem) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        Diem existing = getById(id);
        BigDecimal oldValue = existing.getGiaTriDiem();
        validateDiem(diem);

        // Partial update: only update non-null fields from request
        if (diem.getGiaTriDiem() != null) existing.setGiaTriDiem(diem.getGiaTriDiem());
        if (diem.getNhanXet() != null) existing.setNhanXet(diem.getNhanXet());
        if (diem.getGhiChu() != null) existing.setGhiChu(diem.getGhiChu());
        if (diem.getStatus() != null) existing.setStatus(diem.getStatus());
        if (diem.getLoaiDiem() != null) existing.setLoaiDiem(diem.getLoaiDiem());
        if (diem.getSoThuTu() != null) existing.setSoThuTu(diem.getSoThuTu());

        Diem saved = diemRepository.save(existing);
        createAuditLog(saved, oldValue, saved.getGiaTriDiem(), "UPDATE");
        return saved;
    }

    @Transactional
    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        Diem existing = getById(id);
        createAuditLog(existing, existing.getGiaTriDiem(), null, "DELETE");
        diemRepository.deleteById(id);
    }

    private boolean isDiemLocked(Diem diem, Map<String, Boolean> locks) {
        if (locks == null || locks.isEmpty()) return false;
        
        Integer subjectId = diem.getMonHoc() != null ? diem.getMonHoc().getId() : null;
        if (subjectId == null) return false;
        
        String semester = diem.getHocKy() != null && diem.getHocKy() == 2 ? "HK2" : "HK1";
        
        String column;
        if ("TX".equalsIgnoreCase(diem.getLoaiDiem())) {
            if (diem.getSoThuTu() != null && diem.getSoThuTu() > 0) {
                column = "tx-" + (diem.getSoThuTu() - 1);
            } else {
                column = "comment"; // Cho môn đánh giá bằng nhận xét
            }
        } else if ("GK".equalsIgnoreCase(diem.getLoaiDiem())) {
            column = "gk";
        } else if ("CK".equalsIgnoreCase(diem.getLoaiDiem())) {
            column = "ck";
        } else {
            return false;
        }
        
        String lockKey = subjectId + ":" + semester + ":" + column;
        return Boolean.TRUE.equals(locks.get(lockKey));
    }

    @Transactional
    public List<Diem> saveAll(List<Diem> diemList) {
        if (diemList == null || diemList.isEmpty()) return List.of();

        Map<String, Boolean> locks = new HashMap<>();
        try {
            AdminConfig config = adminConfigService.getByKey("score_locks");
            if (config != null && config.getConfigValue() != null) {
                locks = objectMapper.readValue(config.getConfigValue(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Boolean>>() {});
            }
        } catch (Exception e) {
            // ignore if config not found or invalid JSON
        }

        // Validate all entries before saving
        for (Diem diem : diemList) {
            validateDiem(diem);
            if (isDiemLocked(diem, locks)) {
                throw new com.hethongtruongthpt.exception.ApiException("Cột điểm đã bị khóa bởi quản trị viên, không thể sửa đổi.");
            }
        }

        // Batch load existing records
        List<Integer> existingIds = diemList.stream()
            .filter(d -> d.getId() != null)
            .map(Diem::getId)
            .toList();

        Map<Integer, Diem> existingMap = existingIds.isEmpty()
            ? Map.of()
            : diemRepository.findAllById(existingIds).stream()
                .collect(Collectors.toMap(Diem::getId, d -> d));

        // Merge incoming data with existing records for updates
        List<Diem> toSave = new ArrayList<>();
        for (Diem incoming : diemList) {
            if (incoming.getId() != null && existingMap.containsKey(incoming.getId())) {
                // Update existing record by ID
                Diem existing = existingMap.get(incoming.getId());
                if (incoming.getGiaTriDiem() != null) existing.setGiaTriDiem(incoming.getGiaTriDiem());
                if (incoming.getNhanXet() != null) existing.setNhanXet(incoming.getNhanXet());
                if (incoming.getGhiChu() != null) existing.setGhiChu(incoming.getGhiChu());
                if (incoming.getStatus() != null) existing.setStatus(incoming.getStatus());
                if (incoming.getLoaiDiem() != null) existing.setLoaiDiem(incoming.getLoaiDiem());
                if (incoming.getSoThuTu() != null) existing.setSoThuTu(incoming.getSoThuTu());
                toSave.add(existing);
            } else {
                // Upsert: find existing by unique key
                Diem existing = findExistingByUniqueKey(incoming);
                if (existing != null) {
                    if (incoming.getGiaTriDiem() != null) existing.setGiaTriDiem(incoming.getGiaTriDiem());
                    if (incoming.getNhanXet() != null) existing.setNhanXet(incoming.getNhanXet());
                    if (incoming.getGhiChu() != null) existing.setGhiChu(incoming.getGhiChu());
                    if (incoming.getStatus() != null) existing.setStatus(incoming.getStatus());
                    toSave.add(existing);
                } else {
                    toSave.add(incoming);
                }
            }
        }

        // Save with upsert: catch duplicate key and update instead
        List<Diem> saved = new ArrayList<>();
        try {
            saved = diemRepository.saveAll(toSave);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Fallback: save one by one, update on conflict
            for (Diem d : toSave) {
                try {
                    saved.add(diemRepository.save(d));
                } catch (org.springframework.dao.DataIntegrityViolationException e2) {
                    Diem existing = findExistingByUniqueKey(d);
                    if (existing != null) {
                        if (d.getGiaTriDiem() != null) existing.setGiaTriDiem(d.getGiaTriDiem());
                        if (d.getNhanXet() != null) existing.setNhanXet(d.getNhanXet());
                        if (d.getGhiChu() != null) existing.setGhiChu(d.getGhiChu());
                        if (d.getStatus() != null) existing.setStatus(d.getStatus());
                        saved.add(diemRepository.save(existing));
                    }
                }
            }
        }

        // Batch audit logs
        List<DiemAuditLog> auditLogs = new ArrayList<>();
        for (Diem diem : saved) {
            DiemAuditLog log = new DiemAuditLog();
            log.setDiem(diem);
            log.setHocSinh(diem.getHocSinh());
            log.setMonHoc(diem.getMonHoc());
            log.setGiaTriMoi(diem.getGiaTriDiem());
            log.setGiaoVien(diem.getGiaoVienNhap());

            Diem old = existingMap.get(diem.getId());
            if (old != null) {
                log.setGiaTriCu(old.getGiaTriDiem());
                log.setHanhDong("UPDATE");
            } else {
                log.setGiaTriCu(null);
                log.setHanhDong("INSERT");
            }
            auditLogs.add(log);
        }

        try {
            diemAuditLogRepository.saveAll(auditLogs);
        } catch (Exception e) {
            logger.warn("Không thể lưu audit log: {}", e.getMessage());
        }

        return saved;
    }

    private Diem findExistingByUniqueKey(Diem d) {
        try {
            if (d.getHocSinh() == null || d.getMonHoc() == null) return null;
            Integer hsId = d.getHocSinh().getId();
            Integer mhId = d.getMonHoc().getId();
            if (hsId == null || mhId == null) return null;
            return diemRepository.findByHocSinhIdAndMonHocIdAndLoaiDiemAndSoThuTuAndHocKyAndNamHoc(
                hsId, mhId, d.getLoaiDiem(), d.getSoThuTu(), d.getHocKy(), d.getNamHoc());
        } catch (Exception e) {
            logger.warn("Lookup diem by unique key failed: {}", e.getMessage());
            return null;
        }
    }

    private void createAuditLog(Diem diem, BigDecimal oldValue, BigDecimal newValue, String action) {
        try {
            DiemAuditLog auditLog = new DiemAuditLog();
            auditLog.setDiem(diem);
            auditLog.setHocSinh(diem.getHocSinh());
            auditLog.setMonHoc(diem.getMonHoc());
            auditLog.setGiaTriCu(oldValue);
            auditLog.setGiaTriMoi(newValue);
            auditLog.setHanhDong(action);
            auditLog.setGiaoVien(diem.getGiaoVienNhap());
            diemAuditLogRepository.save(auditLog);
        } catch (Exception e) {
            logger.warn("Không thể lưu audit log: {}", e.getMessage());
        }
    }
}
