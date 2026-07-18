package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.SmsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmsLogRepository extends JpaRepository<SmsLog, Integer> {
    List<SmsLog> findByHocSinhId(Integer hocSinhId);
    List<SmsLog> findByTrangThai(String trangThai);
    long countByHocSinhIdAndThangNam(Integer hocSinhId, String thangNam);
}
