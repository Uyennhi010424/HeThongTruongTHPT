package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.BaiLam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BaiLamRepository extends JpaRepository<BaiLam, Integer> {
    List<BaiLam> findByHocSinhIdOrderByThoiGianBatDauDesc(Integer hocSinhId);
    List<BaiLam> findByBaiKiemTraId(Integer baiKiemTraId);
    List<BaiLam> findByBaiKiemTraIdAndHocSinhId(Integer baiKiemTraId, Integer hocSinhId);
}
