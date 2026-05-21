package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.DiemAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DiemAuditLogRepository extends JpaRepository<DiemAuditLog, Integer> {
    List<DiemAuditLog> findByDiemId(Integer diemId);
    List<DiemAuditLog> findByHocSinhIdAndMonHocId(Integer hocSinhId, Integer monHocId);
    List<DiemAuditLog> findByThoiGianBetween(LocalDateTime startTime, LocalDateTime endTime);
    List<DiemAuditLog> findByGiaoVienId(Integer giaoVienId);
}
