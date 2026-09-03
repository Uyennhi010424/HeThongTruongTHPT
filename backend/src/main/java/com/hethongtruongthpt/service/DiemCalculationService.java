package com.hethongtruongthpt.service;

import com.hethongtruongthpt.repository.DiemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import org.springframework.cache.annotation.Cacheable;
import com.hethongtruongthpt.dto.DiemProgressDTO;

import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.PhanCongDayRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.PhanCongDay;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.dto.ClassScoreboardDTO;
import com.hethongtruongthpt.dto.ClassScoreboardDTO.SubjectInfo;
import com.hethongtruongthpt.dto.ClassScoreboardDTO.StudentScoreInfo;
import java.util.stream.Collectors;

@Service
public class DiemCalculationService {
    private static final Logger logger = LoggerFactory.getLogger(DiemCalculationService.class);
    private final DiemRepository diemRepository;
    private final LopHocRepository lopHocRepository;
    private final PhanCongDayRepository phanCongDayRepository;
    private final HocSinhRepository hocSinhRepository;
    private final com.hethongtruongthpt.repository.NamHocRepository namHocRepository;

    public DiemCalculationService(DiemRepository diemRepository,
                                  LopHocRepository lopHocRepository,
                                  PhanCongDayRepository phanCongDayRepository,
                                  HocSinhRepository hocSinhRepository,
                                  com.hethongtruongthpt.repository.NamHocRepository namHocRepository) {
        this.diemRepository = diemRepository;
        this.lopHocRepository = lopHocRepository;
        this.phanCongDayRepository = phanCongDayRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.namHocRepository = namHocRepository;
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

    public List<Map<String, Object>> getTeacherReportStats(String namHoc, Integer giaoVienId) {
        return diemRepository.findTeacherReportStats(namHoc, giaoVienId);
    }

    public List<DiemProgressDTO> getProgressSummary(String namHoc, Integer hocKy) {
        List<Map<String, Object>> raw = diemRepository.getProgressSummary(namHoc, hocKy);
        List<DiemProgressDTO> result = new ArrayList<>();
        if (!raw.isEmpty()) {
            logger.info("getProgressSummary sample row keys: {}", raw.get(0).keySet());
            logger.info("getProgressSummary sample row values: {}", raw.get(0));
        }
        for (Map<String, Object> row : raw) {
            DiemProgressDTO dto = new DiemProgressDTO();
            dto.setLopId(getVal(row, "lopId", "lop_id") != null ? ((Number) getVal(row, "lopId", "lop_id")).intValue() : 0);
            dto.setTenLop(getVal(row, "tenLop", "ten_lop") != null ? String.valueOf(getVal(row, "tenLop", "ten_lop")) : "");
            dto.setTenGvcn(getVal(row, "tenGvcn", "ten_gvcn") != null ? String.valueOf(getVal(row, "tenGvcn", "ten_gvcn")) : "Chưa gán");
            dto.setSiSo(getVal(row, "siSo", "si_so") != null ? ((Number) getVal(row, "siSo", "si_so")).intValue() : 0);
            
            Integer siSo = dto.getSiSo();
            Object expectedObj = getVal(row, "expectedScoresPerStudent", "expectedscoresperstudent", "expected_scores_per_student");
            int expectedPerStudent = 0;
            if (expectedObj != null) {
                try { expectedPerStudent = (int) Double.parseDouble(expectedObj.toString()); } catch (Exception ignored) {}
            }
            Integer totalExpected = siSo * expectedPerStudent;
            
            Object enteredObj = getVal(row, "enteredScores", "enteredscores", "entered_scores");
            int entered = 0;
            if (enteredObj != null) {
                try { entered = (int) Double.parseDouble(enteredObj.toString()); } catch (Exception ignored) {}
            }
            
            // Derive hasScores directly from enteredScores to avoid alias mapping issues
            boolean hasScores = entered > 0;
            dto.setHasScores(hasScores);
            
            dto.setTotalExpectedScores(totalExpected);
            dto.setTotalEnteredScores(entered);
            
            if (totalExpected > 0) {
                double pct = ((double) entered / totalExpected) * 100.0;
                dto.setProgressPercentage(Math.min(100.0, Math.round(pct * 10.0) / 10.0));
            } else {
                dto.setProgressPercentage(0.0);
            }
            
            result.add(dto);
        }
        return result;
    }

    private Double toScore(BigDecimal bd) {
        if (bd == null) return null;
        return bd.doubleValue();
    }

    private Double calcSemesterAvg(List<Double> tx, Double gk, Double ck) {
        if (tx == null) tx = new ArrayList<>();
        if (tx.isEmpty() || gk == null || ck == null) return null;
        double sumTx = 0;
        for (Double val : tx) {
            sumTx += val;
        }
        double avg = (sumTx + 2 * gk + 3 * ck) / (tx.size() + 5);
        return Math.round(avg * 100.0) / 100.0;
    }

    public ClassScoreboardDTO getClassScoreboard(String namHoc, Integer hocKy, Integer lopId) {
        LopHoc lop = lopHocRepository.findById(lopId).orElse(null);
        Map<String, Object> classInfo = new HashMap<>();
        if (lop != null) {
            classInfo.put("lopId", lop.getId());
            classInfo.put("tenLop", lop.getTenLop());
            classInfo.put("tenGvcn", lop.getGvcn() != null ? lop.getGvcn().getHoTen() : "Chưa gán");
            classInfo.put("namHoc", lop.getNamHoc());
            classInfo.put("siSo", lop.getSiSo());
        }

        List<PhanCongDay> pcList = phanCongDayRepository.findByLopId(lopId).stream()
                .filter(pc -> namHoc.equals(pc.getNamHoc()) && hocKy.equals(pc.getHocKy()))
                .collect(Collectors.toList());

        Map<Integer, SubjectInfo> subjectMap = new LinkedHashMap<>();
        for (PhanCongDay pc : pcList) {
            if (pc.getMonHoc() != null) {
                subjectMap.putIfAbsent(pc.getMonHoc().getId(), new SubjectInfo(pc.getMonHoc().getId(), pc.getMonHoc().getTenMon(), pc.getMonHoc().getNhomDanhGia()));
            }
        }
        List<SubjectInfo> subjects = subjectMap.values().stream()
                .sorted((a, b) -> {
                    boolean aNhanXet = "NHAN_XET".equalsIgnoreCase(a.getNhomDanhGia());
                    boolean bNhanXet = "NHAN_XET".equalsIgnoreCase(b.getNhomDanhGia());
                    if (aNhanXet && !bNhanXet) return 1;
                    if (!aNhanXet && bNhanXet) return -1;
                    return a.getTenMon().compareTo(b.getTenMon());
                })
                .collect(Collectors.toList());

        List<HocSinh> hocSinhList = hocSinhRepository.findByLopId(lopId).stream()
                .filter(hs -> hs.getTrangThai() == 1) // only active students
                .sorted((a, b) -> {
                    String[] nameA = a.getHoTen().split(" ");
                    String[] nameB = b.getHoTen().split(" ");
                    return nameA[nameA.length - 1].compareTo(nameB[nameB.length - 1]);
                })
                .collect(Collectors.toList());

        List<Diem> diemList = diemRepository.findByHocSinhLopIdAndHocKyAndNamHoc(lopId, hocKy, namHoc);
        Map<Integer, List<Diem>> diemByHs = diemList.stream().collect(Collectors.groupingBy(d -> d.getHocSinh().getId()));

        long numNumericSubjects = subjects.stream()
                .filter(s -> !"NHAN_XET".equalsIgnoreCase(s.getNhomDanhGia()))
                .count();

        List<StudentScoreInfo> students = new ArrayList<>();
        for (HocSinh hs : hocSinhList) {
            List<Diem> hsScores = diemByHs.getOrDefault(hs.getId(), new ArrayList<>());
            Map<Integer, Object> scoresMap = new HashMap<>();
            double sumAvg = 0;
            int countAvg = 0;

            for (SubjectInfo subj : subjects) {
                List<Diem> mhScores = hsScores.stream()
                        .filter(d -> d.getMonHoc().getId().equals(subj.getId()))
                        .collect(Collectors.toList());
                
                if ("NHAN_XET".equalsIgnoreCase(subj.getNhomDanhGia())) {
                    String finalNx = mhScores.stream()
                            .filter(d -> "CK".equalsIgnoreCase(d.getLoaiDiem()) && d.getNhanXet() != null)
                            .map(Diem::getNhanXet)
                            .findFirst()
                            .orElse(null);
                    if (finalNx == null) {
                        finalNx = mhScores.stream()
                                .filter(d -> "GK".equalsIgnoreCase(d.getLoaiDiem()) && d.getNhanXet() != null)
                                .map(Diem::getNhanXet)
                                .findFirst()
                                .orElse(null);
                    }
                    if (finalNx == null) {
                        finalNx = mhScores.stream()
                                .filter(d -> "TX".equalsIgnoreCase(d.getLoaiDiem()) && d.getNhanXet() != null)
                                .map(Diem::getNhanXet)
                                .findFirst()
                                .orElse(null);
                    }
                    
                    String val = null;
                    if ("DAT".equals(finalNx)) val = "Đạt";
                    else if ("CHUA_DAT".equals(finalNx)) val = "Chưa đạt";
                    
                    scoresMap.put(subj.getId(), val);
                } else {
                    List<Double> tx = mhScores.stream()
                            .filter(d -> "TX".equalsIgnoreCase(d.getLoaiDiem()))
                            .map(d -> toScore(d.getGiaTriDiem()))
                            .filter(java.util.Objects::nonNull)
                            .collect(Collectors.toList());
                    Double gk = mhScores.stream()
                            .filter(d -> "GK".equalsIgnoreCase(d.getLoaiDiem()))
                            .map(d -> toScore(d.getGiaTriDiem()))
                            .filter(java.util.Objects::nonNull)
                            .findFirst().orElse(null);
                    Double ck = mhScores.stream()
                            .filter(d -> "CK".equalsIgnoreCase(d.getLoaiDiem()))
                            .map(d -> toScore(d.getGiaTriDiem()))
                            .filter(java.util.Objects::nonNull)
                            .findFirst().orElse(null);

                    Double avg = calcSemesterAvg(tx, gk, ck);
                    scoresMap.put(subj.getId(), avg);
                    if (avg != null) {
                        sumAvg += avg;
                        countAvg++;
                    }
                }
            }

            Double dtbHk = null;
            if (countAvg == numNumericSubjects && countAvg > 0) {
                dtbHk = Math.round((sumAvg / countAvg) * 100.0) / 100.0;
            }

            students.add(new StudentScoreInfo(hs.getId(), hs.getMaHocSinh(), hs.getHoTen(), scoresMap, dtbHk));
        }

        return new ClassScoreboardDTO(classInfo, subjects, students);
    }

    public List<Map<String, Object>> convertSummary(List<com.hethongtruongthpt.dto.DiemSummaryDTO> raw) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (raw.isEmpty()) {
            logger.warn("convertSummary: raw query trả về 0 rows!");
        } else {
            logger.info("convertSummary: {} rows", raw.size());
        }
        for (com.hethongtruongthpt.dto.DiemSummaryDTO row : raw) {
            Map<String, Object> item = new HashMap<>();
            item.put("hocSinhId", row.getHoc_sinh_id());
            item.put("monHocId", row.getMon_hoc_id());
            item.put("loaiDiem", row.getLoai_diem());
            item.put("soThuTu", row.getSo_thu_tu());
            item.put("hocKy", row.getHoc_ky());
            item.put("namHoc", row.getNam_hoc());
            item.put("giaTriDiem", row.getGia_tri());
            item.put("nhanXet", row.getNhan_xet());
            item.put("lopId", row.getLop_id());
            item.put("khoi", row.getKhoi());
            result.add(item);
        }
        return result;
    }

    public Object getVal(Map<String, Object> row, String... keys) {
        for (String key : keys) {
            Object val = row.get(key);
            if (val != null) return val;
        }
        for (String key : keys) {
            for (Map.Entry<String, Object> entry : row.entrySet()) {
                if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(key) && entry.getValue() != null) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    public List<Map<String, Object>> getAvgByGrade(String namHoc) {
        String effectiveNamHoc = (namHoc != null && !namHoc.isBlank()) ? namHoc : getDefaultNamHoc();
        List<Map<String, Object>> summary = getSummaryByNamHoc(effectiveNamHoc);

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

            double scoreType = 1.0; 
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
                    } else if (hasGk) {
                        avg1 = (sumTx + 2 * gk) / (txCount + 2);
                    } else if (txCount > 0) {
                        avg1 = sumTx / txCount;
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
                    } else if (hasGk) {
                        avg2 = (sumTx + 2 * gk) / (txCount + 2);
                    } else if (txCount > 0) {
                        avg2 = sumTx / txCount;
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

    public Map<String, Object> getDistribution(String namHoc, Integer hocKy, Integer khoi) {
        String effectiveNamHoc = (namHoc != null && !namHoc.isBlank()) ? namHoc : getDefaultNamHoc();
        List<Map<String, Object>> summary = getSummaryByNamHoc(effectiveNamHoc);

        Map<String, Map<String, Map<Integer, List<double[]>>>> studentSubjectSemesterScores = new HashMap<>();

        for (Map<String, Object> item : summary) {
            Object studentIdObj = getVal(item, "hoc_sinh_id", "hocSinhId");
            Object scoreObj = getVal(item, "gia_tri", "giaTriDiem");
            Object loaiDiemObj = getVal(item, "loai_diem", "loaiDiem");
            Object hocKyObj = getVal(item, "hoc_ky", "hocKy");
            Object monHocIdObj = getVal(item, "mon_hoc_id", "monHocId");
            Object itemKhoiObj = getVal(item, "khoi", "khoi");

            if (studentIdObj == null || scoreObj == null) continue;

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

            if (hocKy != null && hocKy != 0) {
                if (itemHocKy != hocKy) continue;
            }

            String monId = monHocIdObj != null ? monHocIdObj.toString() : "0";

            double scoreType = 1.0; 
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
                        } else if (hasGk) {
                            double subjectSemesterAvg = (sumTx + 2 * gk) / (txCount + 2);
                            studentSubjectAverages.add(subjectSemesterAvg);
                        } else if (txCount > 0) {
                            double subjectSemesterAvg = sumTx / txCount;
                            studentSubjectAverages.add(subjectSemesterAvg);
                        }
                    }
                } else {
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
                        } else if (hasGk) {
                            avg1 = (sumTx + 2 * gk) / (txCount + 2);
                        } else if (txCount > 0) {
                            avg1 = sumTx / txCount;
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
                        } else if (hasGk) {
                            avg2 = (sumTx + 2 * gk) / (txCount + 2);
                        } else if (txCount > 0) {
                            avg2 = sumTx / txCount;
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

    public String getDefaultNamHoc() {
        try {
            com.hethongtruongthpt.entity.NamHoc active = namHocRepository.findAll().stream()
                .filter(n -> "DANG_MO".equals(n.getTrangThai()))
                .max(java.util.Comparator.comparing(com.hethongtruongthpt.entity.NamHoc::getNgayBatDauHk1))
                .orElse(null);
            if (active != null) return active.getTenNamHoc();
        } catch (Exception e) {
            logger.error("Error getting default NamHoc: ", e);
        }
        java.time.LocalDate now = java.time.LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        return month >= 9 ? year + "-" + (year + 1) : (year - 1) + "-" + year;
    }
}
