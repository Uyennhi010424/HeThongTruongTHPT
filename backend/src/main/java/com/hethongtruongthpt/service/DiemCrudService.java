package com.hethongtruongthpt.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hethongtruongthpt.entity.AdminConfig;
import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.entity.DiemAuditLog;
import com.hethongtruongthpt.exception.ApiException;
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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DiemCrudService {
    private static final Logger logger = LoggerFactory.getLogger(DiemCrudService.class);
    private final DiemRepository diemRepository;
    private final DiemAuditLogRepository diemAuditLogRepository;
    private final AdminConfigService adminConfigService;
    private final ObjectMapper objectMapper;

    private static final List<String> VALID_LOAI_DIEM = Arrays.asList("TX", "GK", "CK");
    private static final BigDecimal MIN_SCORE = BigDecimal.ZERO;
    private static final BigDecimal MAX_SCORE = BigDecimal.TEN;

    public DiemCrudService(DiemRepository diemRepository,
                           DiemAuditLogRepository diemAuditLogRepository,
                           AdminConfigService adminConfigService,
                           ObjectMapper objectMapper) {
        this.diemRepository = diemRepository;
        this.diemAuditLogRepository = diemAuditLogRepository;
        this.adminConfigService = adminConfigService;
        this.objectMapper = objectMapper;
    }

    public void validateDiem(Diem diem) {
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

    public List<Diem> getByHocSinhLopIdAndHocKyAndNamHoc(Integer lopId, Integer hocKy, String namHoc) {
        return diemRepository.findByHocSinhLopIdAndHocKyAndNamHoc(lopId, hocKy, namHoc);
    }

    public List<Diem> getByNamHoc(String namHoc) {
        return diemRepository.findByNamHoc(namHoc);
    }

    public List<Diem> getByHocSinhId(Integer hocSinhId) {
        if (hocSinhId == null) return List.of();
        return diemRepository.findByHocSinhId(hocSinhId);
    }

    public List<Map<String, Object>> getClassProgressSummary(String namHoc, Integer hocKy, Integer lopId) {
        return diemRepository.getClassProgressSummary(namHoc, hocKy, lopId);
    }

    @Transactional
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

    public boolean isDiemLocked(Diem diem, Map<String, Boolean> locks) {
        if (locks == null || locks.isEmpty()) return false;
        
        Integer subjectId = diem.getMonHoc() != null ? diem.getMonHoc().getId() : null;
        if (subjectId == null) return false;
        
        String semester = diem.getHocKy() != null && diem.getHocKy() == 2 ? "HK2" : "HK1";
        
        String column;
        if ("TX".equalsIgnoreCase(diem.getLoaiDiem())) {
            if (diem.getSoThuTu() != null && diem.getSoThuTu() > 0) {
                column = "tx-" + (diem.getSoThuTu() - 1);
            } else {
                column = "comment";
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
            // ignore
        }

        for (Diem diem : diemList) {
            validateDiem(diem);
            if (isDiemLocked(diem, locks)) {
                throw new ApiException("Cột điểm đã bị khóa bởi quản trị viên, không thể sửa đổi.");
            }
        }

        List<Integer> existingIds = diemList.stream()
            .filter(d -> d.getId() != null)
            .map(Diem::getId)
            .toList();

        Map<Integer, Diem> existingMap = existingIds.isEmpty()
            ? Map.of()
            : diemRepository.findAllById(existingIds).stream()
                .collect(Collectors.toMap(Diem::getId, d -> d));

        List<Diem> toSave = new ArrayList<>();
        for (Diem incoming : diemList) {
            if (incoming.getId() != null && existingMap.containsKey(incoming.getId())) {
                Diem existing = existingMap.get(incoming.getId());
                if (incoming.getGiaTriDiem() != null) existing.setGiaTriDiem(incoming.getGiaTriDiem());
                if (incoming.getNhanXet() != null) existing.setNhanXet(incoming.getNhanXet());
                if (incoming.getGhiChu() != null) existing.setGhiChu(incoming.getGhiChu());
                if (incoming.getStatus() != null) existing.setStatus(incoming.getStatus());
                if (incoming.getLoaiDiem() != null) existing.setLoaiDiem(incoming.getLoaiDiem());
                if (incoming.getSoThuTu() != null) existing.setSoThuTu(incoming.getSoThuTu());
                toSave.add(existing);
            } else {
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

        List<Diem> saved = new ArrayList<>();
        try {
            saved = diemRepository.saveAll(toSave);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
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

    public Diem findExistingByUniqueKey(Diem d) {
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

    public void createAuditLog(Diem diem, BigDecimal oldValue, BigDecimal newValue, String action) {
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
