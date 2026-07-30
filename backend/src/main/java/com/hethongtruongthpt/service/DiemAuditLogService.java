package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.entity.DiemAuditLog;
import com.hethongtruongthpt.repository.DiemAuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DiemAuditLogService {
    private static final Logger logger = LoggerFactory.getLogger(DiemAuditLogService.class);
    private final DiemAuditLogRepository diemAuditLogRepository;

    public DiemAuditLogService(DiemAuditLogRepository diemAuditLogRepository) {
        this.diemAuditLogRepository = diemAuditLogRepository;
    }

    @Async
    public void createAuditLogAsync(Diem diem, BigDecimal oldValue, BigDecimal newValue, String action) {
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

    @Async
    public void saveAllAuditLogsAsync(List<DiemAuditLog> auditLogs) {
        if (auditLogs == null || auditLogs.isEmpty()) return;
        try {
            diemAuditLogRepository.saveAll(auditLogs);
        } catch (Exception e) {
            logger.warn("Không thể lưu batch audit log: {}", e.getMessage());
        }
    }
}
