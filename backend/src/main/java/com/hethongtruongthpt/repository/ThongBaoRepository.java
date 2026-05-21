package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.ThongBao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ThongBaoRepository extends JpaRepository<ThongBao, Integer> {
    List<ThongBao> findByLoai(String loai);
    List<ThongBao> findByLopId(Integer lopId);
    List<ThongBao> findByHocSinhId(Integer hocSinhId);
    List<ThongBao> findByHanHienThiGreaterThan(LocalDateTime now);
}