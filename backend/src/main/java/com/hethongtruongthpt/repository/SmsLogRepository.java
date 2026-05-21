package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.SmsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmsLogRepository extends JpaRepository<SmsLog, Integer> {
    List<SmsLog> findByTrangThai(String trangThai);
    List<SmsLog> findByThangNam(String thangNam);
    List<SmsLog> findByHocSinhId(Integer hocSinhId);
}
