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
    private final LichSuHocTapRepository lichSuHocTapRepository;
    private final HocBaRepository hocBaRepository;
    private final NamHocRepository namHocRepository;

    public LopHocService(LopHocRepository lopHocRepository, HocSinhRepository hocSinhRepository, GiaoVienRepository giaoVienRepository, LichSuHocTapRepository lichSuHocTapRepository, HocBaRepository hocBaRepository, NamHocRepository namHocRepository) {
        this.lopHocRepository = lopHocRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.giaoVienRepository = giaoVienRepository;
        this.lichSuHocTapRepository = lichSuHocTapRepository;
        this.hocBaRepository = hocBaRepository;
        this.namHocRepository = namHocRepository;
    }

    public List<LopHoc> getAll() {
        return lopHocRepository.findAll();
    }

    public Page<LopHoc> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("tenLop").ascending());
        return lopHocRepository.findAll(pageable);
    }

    public LopHoc getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return lopHocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
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

        // Pre-fetch all LichSuHocTap for current school year into set of student IDs
        Set<Integer> existingHistoryStudentIds = lichSuHocTapRepository.findByNamHoc(currentNamHoc)
                .stream()
                .filter(ls -> ls.getHocSinh() != null && ls.getHocSinh().getId() != null)
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
                if (oldLop.getGvcn() != null) {
                    log.info("Xóa chủ nhiệm: GV {} thôi chủ nhiệm lớp {} (tốt nghiệp)",
                        oldLop.getGvcn().getId(), tenLop);
                    oldLop.setGvcn(null);
                }
                oldLop.setSiSo(0);
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
                oldLop.setSiSo(0);

                // Chuyen giao vien chu nhiem sang lop moi
                if (oldLop.getGvcn() != null) {
                    if (newLop.getGvcn() == null || !newLop.getGvcn().getId().equals(oldLop.getGvcn().getId())) {
                        newLop.setGvcn(oldLop.getGvcn());
                        teacherMovedCount++;
                        log.info("Chuyển chủ nhiệm: GV {} từ {} sang {}", oldLop.getGvcn().getId(), tenLop, newTenLop);
                    }
                    oldLop.setGvcn(null);
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
            lopHocRepository.saveAll(classesToSave);
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

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
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

    private void validateLopHoc(LopHoc lopHoc) {
        String tenLop = lopHoc.getTenLop() != null ? lopHoc.getTenLop().trim() : "";
        Integer khoi = lopHoc.getKhoi();
        String namHoc = lopHoc.getNamHoc() != null ? lopHoc.getNamHoc().trim() : "";

        if (tenLop.isBlank()) {
            throw new ApiException("Tên lớp không được để trống");
        }
        if (khoi == null) {
            throw new ApiException("Khối không được để trống");
        }
        if (namHoc.isBlank()) {
            throw new ApiException("Năm học không được để trống");
        }

        String gradeFromName = extractGradePrefix(tenLop);
        if (gradeFromName == null) {
            throw new ApiException("Tên lớp phải bắt đầu bằng 10, 11 hoặc 12");
        }
        if (!gradeFromName.equals(String.valueOf(khoi))) {
            throw new ApiException("Tên lớp không khớp với khối đã chọn");
        }
    }

    private String extractGradePrefix(String tenLop) {
        if (tenLop.startsWith("10")) return "10";
        if (tenLop.startsWith("11")) return "11";
        if (tenLop.startsWith("12")) return "12";
        return null;
    }
}