package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.ChuNhiem;
import com.hethongtruongthpt.entity.ChuNhiemId;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.ChuNhiemRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
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

@Service
public class LopHocService {
    private static final Logger log = LoggerFactory.getLogger(LopHocService.class);
    private final LopHocRepository lopHocRepository;
    private final HocSinhRepository hocSinhRepository;
    private final ChuNhiemRepository chuNhiemRepository;

    public LopHocService(LopHocRepository lopHocRepository, HocSinhRepository hocSinhRepository,
                         ChuNhiemRepository chuNhiemRepository) {
        this.lopHocRepository = lopHocRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.chuNhiemRepository = chuNhiemRepository;
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
        int teacherMovedCount = 0;
        List<String> createdClasses = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (LopHoc oldLop : currentLops) {
            int khoi = oldLop.getKhoi();
            String tenLop = oldLop.getTenLop();

            List<HocSinh> students = hocSinhRepository.findByLopId(oldLop.getId());
            List<ChuNhiem> chuNhiemList = chuNhiemRepository.findById_LopId(oldLop.getId());

            if (khoi == 12) {
                // Tot nghiep: hoc sinh trangThai=2, xoa chu nhiem
                for (HocSinh hs : students) {
                    hs.setLop(null);
                    hs.setTrangThai(2);
                    hocSinhRepository.save(hs);
                    graduatedCount++;
                }
                for (ChuNhiem cn : chuNhiemList) {
                    chuNhiemRepository.delete(cn);
                    log.info("Xóa chủ nhiệm: GV {} thôi chủ nhiệm lớp {} (tốt nghiệp)",
                        cn.getId().getGiaoVienId(), tenLop);
                }
                // Dong bo siSo lop da tot nghiep = 0
                oldLop.setSiSo(0);
                lopHocRepository.save(oldLop);
                log.info("Tốt nghiệp {} học sinh từ lớp {}", students.size(), tenLop);

            } else if (khoi == 10 || khoi == 11) {
                int newKhoi = khoi + 1;
                String newTenLop = tenLop.replaceFirst("^" + khoi, String.valueOf(newKhoi));

                // Tim hoac tao lop moi (giữ nguyên tổ hợp môn từ lớp cũ)
                LopHoc newLop = lopHocRepository.findByTenLopAndNamHoc(newTenLop, nextNamHoc)
                        .orElseGet(() -> {
                            LopHoc created = new LopHoc();
                            created.setTenLop(newTenLop);
                            created.setKhoi(newKhoi);
                            created.setNamHoc(nextNamHoc);
                            created.setSiSo(0);
                            created.setToHopId(oldLop.getToHopId()); // Giữ nguyên tổ hợp
                            createdClasses.add(newTenLop);
                            return lopHocRepository.save(created);
                        });

                // Chuyen hoc sinh sang lop moi
                for (HocSinh hs : students) {
                    hs.setLop(newLop);
                    hocSinhRepository.save(hs);
                    promotedCount++;
                }

                // Dong bo siSo tu so hoc sinh active
                long newCount = hocSinhRepository.countByLopIdAndTrangThai(newLop.getId(), 1);
                newLop.setSiSo((int) newCount);
                lopHocRepository.save(newLop);
                // Cap nhat siSo lop cu
                long oldCount = hocSinhRepository.countByLopIdAndTrangThai(oldLop.getId(), 1);
                oldLop.setSiSo((int) oldCount);
                lopHocRepository.save(oldLop);

                // Chuyen giao vien chu nhiem sang lop moi
                for (ChuNhiem oldCn : chuNhiemList) {
                    Integer gvId = oldCn.getId().getGiaoVienId();
                    ChuNhiemId newCnId = new ChuNhiemId();
                    newCnId.setGiaoVienId(gvId);
                    newCnId.setLopId(newLop.getId());

                    if (!chuNhiemRepository.existsById(newCnId)) {
                        ChuNhiem newCn = new ChuNhiem();
                        newCn.setId(newCnId);
                        chuNhiemRepository.save(newCn);
                        teacherMovedCount++;
                        log.info("Chuyển chủ nhiệm: GV {} từ {} sang {}", gvId, tenLop, newTenLop);
                    }
                    chuNhiemRepository.delete(oldCn);
                }

                log.info("Chuyển {} học sinh từ {} sang {} năm {}", students.size(), tenLop, newTenLop, nextNamHoc);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("promoted", promotedCount);
        result.put("graduated", graduatedCount);
        result.put("teacherMoved", teacherMovedCount);
        result.put("createdClasses", createdClasses);
        result.put("errors", errors);
        return result;
    }

    public LopHoc update(Integer id, LopHoc lopHoc) {
        getById(id);
        validateLopHoc(lopHoc);
        lopHoc.setId(id);
        String tenLop = lopHoc.getTenLop().trim();
        String namHoc = lopHoc.getNamHoc().trim();
        lopHocRepository.findByTenLopAndNamHoc(tenLop, namHoc)
                .filter(existing -> !id.equals(existing.getId()))
                .ifPresent(existing -> {
                    throw new ApiException("Lớp đã tồn tại cho năm học này");
                });
        return lopHocRepository.save(lopHoc);
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
            // Count all enrolled students (1 = active, 2 = graduated/grade 12)
            long count1 = hocSinhRepository.countByLopIdAndTrangThai(lop.getId(), 1);
            long count2 = hocSinhRepository.countByLopIdAndTrangThai(lop.getId(), 2);
            int newSiSo = (int)(count1 + count2);
            if (!Integer.valueOf(newSiSo).equals(lop.getSiSo())) {
                log.info("Đồng bộ sĩ số lớp {}: {} → {}", lop.getTenLop(), lop.getSiSo(), newSiSo);
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