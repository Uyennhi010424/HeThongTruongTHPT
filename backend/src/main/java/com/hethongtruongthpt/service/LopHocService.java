package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.ChuNhiem;
import com.hethongtruongthpt.entity.ChuNhiemId;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.LichSuHocTap;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.ChuNhiemRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.LichSuHocTapRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.HocBaRepository;
import com.hethongtruongthpt.repository.NamHocRepository;
import com.hethongtruongthpt.entity.HocBa;
import com.hethongtruongthpt.entity.NamHoc;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class LopHocService {
    private static final Logger log = LoggerFactory.getLogger(LopHocService.class);
    private final LopHocRepository lopHocRepository;
    private final HocSinhRepository hocSinhRepository;
    private final GiaoVienRepository giaoVienRepository;
    private final ChuNhiemRepository chuNhiemRepository;
    private final LichSuHocTapRepository lichSuHocTapRepository;
    private final HocBaRepository hocBaRepository;
    private final NamHocRepository namHocRepository;

    public LopHocService(LopHocRepository lopHocRepository, HocSinhRepository hocSinhRepository, GiaoVienRepository giaoVienRepository, ChuNhiemRepository chuNhiemRepository, LichSuHocTapRepository lichSuHocTapRepository, HocBaRepository hocBaRepository, NamHocRepository namHocRepository) {
        this.lopHocRepository = lopHocRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.giaoVienRepository = giaoVienRepository;
        this.chuNhiemRepository = chuNhiemRepository;
        this.lichSuHocTapRepository = lichSuHocTapRepository;
        this.hocBaRepository = hocBaRepository;
        this.namHocRepository = namHocRepository;
    }

    public List<LopHoc> getAll() {
        List<LopHoc> list = lopHocRepository.findAll();
        populateActualSiSo(list);
        return list;
    }

    public Page<LopHoc> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("tenLop").ascending());
        Page<LopHoc> paged = lopHocRepository.findAll(pageable);
        populateActualSiSo(paged.getContent());
        return paged;
    }

    public LopHoc getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        LopHoc lop = lopHocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        populateActualSiSo(List.of(lop));
        return lop;
    }

    private void populateActualSiSo(List<LopHoc> lops) {
        if (lops == null || lops.isEmpty()) return;
        for (LopHoc lop : lops) {
            if (lop != null && lop.getId() != null) {
                long count = hocSinhRepository.countByLopIdAndTrangThai(lop.getId(), 1);
                if (count == 0) {
                    long histCount = lichSuHocTapRepository.countByLopId(lop.getId());
                    if (histCount > 0) count = histCount;
                }
                lop.setSiSo((int) count);
            }
        }
    }

    public LopHoc create(LopHoc lopHoc) {
        validateLopHoc(lopHoc);
        String tenLop = lopHoc.getTenLop().trim();
        String namHoc = lopHoc.getNamHoc();
        if (lopHocRepository.findByTenLopAndNamHoc(tenLop, namHoc).isPresent()) {
            throw new ApiException("Lớp đã tồn tại cho năm học này");
        }
        return lopHocRepository.save(lopHoc);
    }

    /**
     * Tao lop hang loat cho nam hoc moi.
     * Tao cac lop 10A1..10A{soLop10}, 11A1..11A{soLop11}, 12A1..12A{soLop12}.
     *
     * @param namHoc   nam hoc (vi du: "2026-2027")
     * @param soLop10  so lop khoi 10
     * @param soLop11  so lop khoi 11
     * @param soLop12  so lop khoi 12
     * @return danh sach lop da tao
     */
    @Transactional
    public List<LopHoc> createBulk(String namHoc, int soLop10, int soLop11, int soLop12) {
        if (namHoc == null || namHoc.isBlank()) {
            throw new ApiException("Năm học không được để trống");
        }
        if (soLop10 < 0 || soLop11 < 0 || soLop12 < 0) {
            throw new ApiException("Số lớp không được âm");
        }
        if (soLop10 == 0 && soLop11 == 0 && soLop12 == 0) {
            throw new ApiException("Phải có ít nhất 1 lớp");
        }

        List<LopHoc> created = new ArrayList<>();

        // Tao lop khoi 10
        for (int i = 1; i <= soLop10; i++) {
            String tenLop = "10A" + i;
            if (lopHocRepository.findByTenLopAndNamHoc(tenLop, namHoc).isEmpty()) {
                LopHoc lop = new LopHoc();
                lop.setTenLop(tenLop);
                lop.setKhoi(10);
                lop.setNamHoc(namHoc);
                lop.setSiSo(0);
                created.add(lopHocRepository.save(lop));
            }
        }

        // Tao lop khoi 11
        for (int i = 1; i <= soLop11; i++) {
            String tenLop = "11A" + i;
            if (lopHocRepository.findByTenLopAndNamHoc(tenLop, namHoc).isEmpty()) {
                LopHoc lop = new LopHoc();
                lop.setTenLop(tenLop);
                lop.setKhoi(11);
                lop.setNamHoc(namHoc);
                lop.setSiSo(0);
                created.add(lopHocRepository.save(lop));
            }
        }

        // Tao lop khoi 12
        for (int i = 1; i <= soLop12; i++) {
            String tenLop = "12A" + i;
            if (lopHocRepository.findByTenLopAndNamHoc(tenLop, namHoc).isEmpty()) {
                LopHoc lop = new LopHoc();
                lop.setTenLop(tenLop);
                lop.setKhoi(12);
                lop.setNamHoc(namHoc);
                lop.setSiSo(0);
                created.add(lopHocRepository.save(lop));
            }
        }

        return created;
    }

    /**
     * Len lop: chuyen hoc sinh + giao vien chu nhiem tu nam hoc hien tai sang nam hoc moi.
     * - Khoi 10 → khoi 11 (GV chủ nhiệm theo lớp)
     * - Khoi 11 → khoi 12 (GV chủ nhiệm theo lớp)
     * - Khoi 12 → tot nghiep (xóa chủ nhiệm, học sinh trangThai=2)
     */
    @Transactional
    public Map<String, Object> promoteStudents(String currentNamHoc, String nextNamHoc) {
        if (currentNamHoc == null || currentNamHoc.isBlank()) {
            throw new ApiException("Năm học hiện tại không được để trống");
        }
        if (nextNamHoc == null || nextNamHoc.isBlank()) {
            throw new ApiException("Năm học mới không được để trống");
        }
        if (currentNamHoc.equals(nextNamHoc)) {
            throw new ApiException("Năm học mới phải khác năm học hiện tại");
        }

        List<LopHoc> currentLops = lopHocRepository.findByNamHoc(currentNamHoc);
        if (currentLops.isEmpty()) {
            throw new ApiException("Không tìm thấy lớp nào cho năm học " + currentNamHoc);
        }

        int promotedCount = 0;
        int graduatedCount = 0;
        int failedCount = 0;
        int teacherMovedCount = 0;
        List<String> createdClasses = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        NamHoc currentNamHocObj = namHocRepository.findByTenNamHoc(currentNamHoc).orElse(null);

        // Pre-fetch all HocBa for current school year into map (hocSinhId -> HocBa)
        Map<Integer, HocBa> hocBaByStudentId = new HashMap<>();
        if (currentNamHocObj != null) {
            List<HocBa> allHocBa = hocBaRepository.findByNamHocId(currentNamHocObj.getId());
            for (HocBa hb : allHocBa) {
                if (hb.getHocSinh() != null && hb.getHocSinh().getId() != null) {
                    hocBaByStudentId.put(hb.getHocSinh().getId(), hb);
                }
            }
        }

        // Pre-fetch all LichSuHocTap (end-of-year promotion results) for current school year into set of student IDs
        Set<Integer> existingHistoryStudentIds = lichSuHocTapRepository.findByNamHoc(currentNamHoc)
                .stream()
                .filter(ls -> ls.getHocSinh() != null && ls.getHocSinh().getId() != null)
                .filter(ls -> {
                    String kq = ls.getKetQua();
                    return "Lên lớp".equalsIgnoreCase(kq) || "Tốt nghiệp".equalsIgnoreCase(kq) || "Ở lại lớp".equalsIgnoreCase(kq);
                })
                .map(ls -> ls.getHocSinh().getId())
                .collect(Collectors.toSet());

        // Pre-fetch next year classes into a map (tenLop -> LopHoc)
        Map<String, LopHoc> nextYearClassMap = lopHocRepository.findByNamHoc(nextNamHoc)
                .stream()
                .collect(Collectors.toMap(LopHoc::getTenLop, lop -> lop, (existing, replace) -> existing));

        List<LichSuHocTap> historyToSave = new ArrayList<>();
        List<HocSinh> studentsToSave = new ArrayList<>();
        List<LopHoc> classesToSave = new ArrayList<>();

        for (LopHoc oldLop : currentLops) {
            int khoi = oldLop.getKhoi();
            String tenLop = oldLop.getTenLop();

            List<HocSinh> students = hocSinhRepository.findByLopId(oldLop.getId());
            if (khoi == 12) {
                // Tot nghiep: hoc sinh trangThai=2, xoa chu nhiem
                for (HocSinh hs : students) {
                    HocBa hocBa = hocBaByStudentId.get(hs.getId());
                    boolean isFail = hocBa != null && ((hocBa.getDiemTBCaNam() != null && hocBa.getDiemTBCaNam().doubleValue() < 5.0) || "Yếu".equalsIgnoreCase(hocBa.getHocLuc()) || "Kém".equalsIgnoreCase(hocBa.getHocLuc()));

                    if (!existingHistoryStudentIds.contains(hs.getId())) {
                        LichSuHocTap ls = new LichSuHocTap();
                        ls.setHocSinh(hs);
                        ls.setLopHoc(oldLop);
                        ls.setNamHoc(currentNamHoc);
                        if (hocBa != null) {
                            ls.setDiemTrungBinh(hocBa.getDiemTBCaNam());
                            ls.setHocLuc(hocBa.getHocLuc());
                            ls.setHanhKiem(hocBa.getHanhKiem());
                        }
                        ls.setKetQua(isFail ? "Ở lại lớp" : "Tốt nghiệp");
                        historyToSave.add(ls);
                        existingHistoryStudentIds.add(hs.getId());
                    }
                    hs.setLop(null);
                    if (isFail) {
                        hs.setTrangThai(1);
                        failedCount++;
                    } else {
                        hs.setTrangThai(2);
                        graduatedCount++;
                    }
                    studentsToSave.add(hs);
                }
                // Giu nguyen si so & GVCN cho lop cu de luu tru lich su nam hoc
                if (oldLop.getSiSo() == null || oldLop.getSiSo() == 0) {
                    oldLop.setSiSo(students.size());
                }
                classesToSave.add(oldLop);
                log.info("Tốt nghiệp {} học sinh từ lớp {}", students.size(), tenLop);

            } else if (khoi == 10 || khoi == 11) {
                int newKhoi = khoi + 1;
                String newTenLop = tenLop.replaceFirst("^" + khoi, String.valueOf(newKhoi));

                // Tim hoac tao lop moi (giữ nguyên tổ hợp môn từ lớp cũ)
                LopHoc newLop = nextYearClassMap.get(newTenLop);
                if (newLop == null) {
                    LopHoc created = new LopHoc();
                    created.setTenLop(newTenLop);
                    created.setKhoi(newKhoi);
                    created.setNamHoc(nextNamHoc);
                    created.setSiSo(0);
                    created.setToHopId(oldLop.getToHopId());
                    newLop = lopHocRepository.save(created);
                    nextYearClassMap.put(newTenLop, newLop);
                    createdClasses.add(newTenLop);
                }

                int newClassStudentCount = newLop.getSiSo() != null ? newLop.getSiSo() : 0;

                // Chuyen hoc sinh sang lop moi
                for (HocSinh hs : students) {
                    HocBa hocBa = hocBaByStudentId.get(hs.getId());
                    boolean isFail = hocBa != null && ((hocBa.getDiemTBCaNam() != null && hocBa.getDiemTBCaNam().doubleValue() < 5.0) || "Yếu".equalsIgnoreCase(hocBa.getHocLuc()) || "Kém".equalsIgnoreCase(hocBa.getHocLuc()));

                    if (!existingHistoryStudentIds.contains(hs.getId())) {
                        LichSuHocTap ls = new LichSuHocTap();
                        ls.setHocSinh(hs);
                        ls.setLopHoc(oldLop);
                        ls.setNamHoc(currentNamHoc);
                        if (hocBa != null) {
                            ls.setDiemTrungBinh(hocBa.getDiemTBCaNam());
                            ls.setHocLuc(hocBa.getHocLuc());
                            ls.setHanhKiem(hocBa.getHanhKiem());
                        }
                        ls.setKetQua(isFail ? "Ở lại lớp" : "Lên lớp");
                        historyToSave.add(ls);
                        existingHistoryStudentIds.add(hs.getId());
                    }
                    if (isFail) {
                        hs.setLop(null);
                        failedCount++;
                    } else {
                        hs.setLop(newLop);
                        promotedCount++;
                        newClassStudentCount++;
                    }
                    studentsToSave.add(hs);
                }

                newLop.setSiSo(newClassStudentCount);
                if (oldLop.getSiSo() == null || oldLop.getSiSo() == 0) {
                    oldLop.setSiSo(students.size());
                }

                // Chuyen giao vien chu nhiem sang lop moi (va giu nguyen GVCN o lop cu de bao toan lich su)
                if (oldLop.getGvcn() != null) {
                    if (newLop.getGvcn() == null) {
                        newLop.setGvcn(oldLop.getGvcn());
                        teacherMovedCount++;
                        log.info("Chuyển chủ nhiệm: GV {} sang lớp mới {}", oldLop.getGvcn().getId(), newTenLop);
                    }
                }
                classesToSave.add(newLop);
                classesToSave.add(oldLop);

                log.info("Chuyển {} học sinh từ {} sang {} năm {}", students.size(), tenLop, newTenLop, nextNamHoc);
            }
        }

        if (!historyToSave.isEmpty()) {
            lichSuHocTapRepository.saveAll(historyToSave);
        }
        if (!studentsToSave.isEmpty()) {
            hocSinhRepository.saveAll(studentsToSave);
        }
        if (!classesToSave.isEmpty()) {
            List<LopHoc> savedClasses = lopHocRepository.saveAll(classesToSave);
            for (LopHoc lop : savedClasses) {
                if (lop.getGvcn() != null && lop.getId() != null) {
                    ChuNhiemId cnId = new ChuNhiemId();
                    cnId.setGiaoVienId(lop.getGvcn().getId());
                    cnId.setLopId(lop.getId());
                    if (!chuNhiemRepository.existsById(cnId)) {
                        ChuNhiem cn = new ChuNhiem();
                        cn.setId(cnId);
                        chuNhiemRepository.save(cn);
                    }
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("promoted", promotedCount);
        result.put("graduated", graduatedCount);
        result.put("failed", failedCount);
        result.put("teacherMoved", teacherMovedCount);
        result.put("createdClasses", createdClasses);
        result.put("errors", errors);
        return result;
    }

    public LopHoc update(Integer id, LopHoc lopHoc) {
        LopHoc existing = getById(id);
        validateLopHoc(lopHoc);
        
        String tenLop = lopHoc.getTenLop().trim();
        String namHoc = lopHoc.getNamHoc().trim();
        lopHocRepository.findByTenLopAndNamHoc(tenLop, namHoc)
                .filter(ext -> !id.equals(ext.getId()))
                .ifPresent(ext -> {
                    throw new ApiException("Lớp đã tồn tại cho năm học này");
                });

        existing.setTenLop(tenLop);
        existing.setKhoi(lopHoc.getKhoi());
        existing.setNamHoc(namHoc);
        existing.setToHopId(lopHoc.getToHopId());
        
        return lopHocRepository.save(existing);
    }

    @Transactional
    public LopHoc assignGvcn(Integer lopId, Integer gvcnId) {
        LopHoc lop = getById(lopId);
        if (gvcnId == null) {
            lop.setGvcn(null);
        } else {
            com.hethongtruongthpt.entity.GiaoVien gv = giaoVienRepository.findById(gvcnId)
                .orElseThrow(() -> new ApiException("Không tìm thấy giáo viên"));
            lop.setGvcn(gv);
        }
        return lopHocRepository.save(lop);
    }

    @Transactional
    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        long studentCount = hocSinhRepository.countByLopId(id);
        if (studentCount > 0) {
            throw new ApiException("Không thể xóa lớp học này vì đang có " + studentCount + " học sinh theo học. Vui lòng chuyển lớp cho học sinh trước khi xóa!");
        }
        chuNhiemRepository.deleteById_LopId(id);
        lopHocRepository.deleteById(id);
    }

    /**
     * Dong bo siSo cua mot lop = so hoc sinh active (trangThai=1) trong lop.
     */
    public void syncSiSo(Integer lopId) {
        if (lopId == null) return;
        LopHoc lop = lopHocRepository.findById(lopId).orElse(null);
        if (lop == null) return;
        // Count all enrolled students (1 = active, 2 = graduated/grade 12)
        long count1 = hocSinhRepository.countByLopIdAndTrangThai(lopId, 1);
        long count2 = hocSinhRepository.countByLopIdAndTrangThai(lopId, 2);
        int newSiSo = (int)(count1 + count2);
        if (!Integer.valueOf(newSiSo).equals(lop.getSiSo())) {
            log.info("Cập nhật sĩ số lớp {} (ID={}): {} → {}", lop.getTenLop(), lopId, lop.getSiSo(), newSiSo);
            lop.setSiSo(newSiSo);
            lopHocRepository.save(lop);
        }
    }

    /**
     * Dong bo siSo cho tat ca lop.
     */
    @Transactional
    public int syncAllSiSo() {
        List<LopHoc> allLops = lopHocRepository.findAll();
        int updated = 0;
        for (LopHoc lop : allLops) {
            // Count all enrolled students currently in this class
            long count1 = hocSinhRepository.countByLopIdAndTrangThai(lop.getId(), 1);
            long count2 = hocSinhRepository.countByLopIdAndTrangThai(lop.getId(), 2);
            int newSiSo = (int)(count1 + count2);

            // If current count is 0, check historical enrollment from lich_su_hoc_tap
            if (newSiSo == 0 && lop.getId() != null) {
                long histCount = lichSuHocTapRepository.countByLopId(lop.getId());
                if (histCount > 0) {
                    newSiSo = (int) histCount;
                }
            }

            if (!Integer.valueOf(newSiSo).equals(lop.getSiSo())) {
                log.info("Đồng bộ sĩ số lớp {} ({}): {} → {}", lop.getTenLop(), lop.getNamHoc(), lop.getSiSo(), newSiSo);
                lop.setSiSo(newSiSo);
                lopHocRepository.save(lop);
                updated++;
            }
        }
        log.info("Đồng bộ sĩ số: cập nhật {}/{} lớp", updated, allLops.size());
        return updated;
    }

    private static final java.util.regex.Pattern CLASS_NAME_PATTERN =
            java.util.regex.Pattern.compile("^(10|11|12)[A-Za-z0-9]+$");
    private static final java.util.regex.Pattern SCHOOL_YEAR_PATTERN =
            java.util.regex.Pattern.compile("^\\d{4}-\\d{4}$");
    private static final java.util.regex.Pattern ROOM_PATTERN =
            java.util.regex.Pattern.compile("^[A-Za-z0-9\\s\\.-]+$");

    private void validateLopHoc(LopHoc lopHoc) {
        String tenLop = lopHoc.getTenLop() != null ? lopHoc.getTenLop().trim() : "";
        Integer khoi = lopHoc.getKhoi();
        String namHoc = lopHoc.getNamHoc() != null ? lopHoc.getNamHoc().trim() : "";
        String phongHoc = lopHoc.getPhongHoc() != null ? lopHoc.getPhongHoc().trim() : "";

        if (tenLop.isBlank()) {
            throw new ApiException("Tên lớp không được để trống");
        }
        if (khoi == null) {
            throw new ApiException("Khối không được để trống");
        }
        if (namHoc.isBlank()) {
            throw new ApiException("Năm học không được để trống");
        }
        if (lopHoc.getToHopId() == null) {
            throw new ApiException("Vui lòng chọn tổ hợp môn");
        }

        if (!CLASS_NAME_PATTERN.matcher(tenLop).matches()) {
            throw new ApiException("Tên lớp không hợp lệ (VD: 10A1, 11B2, 12C3)");
        }

        String gradeFromName = extractGradePrefix(tenLop);
        if (gradeFromName == null || !gradeFromName.equals(String.valueOf(khoi))) {
            throw new ApiException("Tên lớp phải thuộc khối " + khoi + " (VD: " + khoi + "A1)");
        }

        if (!SCHOOL_YEAR_PATTERN.matcher(namHoc).matches()) {
            throw new ApiException("Năm học không hợp lệ (VD: 2026-2027)");
        }
        String[] yearParts = namHoc.split("-");
        int startYear = Integer.parseInt(yearParts[0]);
        int endYear = Integer.parseInt(yearParts[1]);
        if (endYear != startYear + 1) {
            throw new ApiException("Năm học không hợp lệ (VD: 2026-2027)");
        }

        if (!phongHoc.isBlank() && !ROOM_PATTERN.matcher(phongHoc).matches()) {
            throw new ApiException("Tên phòng học không hợp lệ (VD: P101, P.102)");
        }
    }

    private String extractGradePrefix(String tenLop) {
        if (tenLop.startsWith("10")) return "10";
        if (tenLop.startsWith("11")) return "11";
        if (tenLop.startsWith("12")) return "12";
        return null;
    }
}