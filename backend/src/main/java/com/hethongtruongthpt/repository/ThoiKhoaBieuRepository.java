package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThoiKhoaBieuRepository extends JpaRepository<ThoiKhoaBieu, Integer> {
    List<ThoiKhoaBieu> findByLopIdAndHocKyAndNamHoc(Integer lopId, Integer hocKy, String namHoc);
    List<ThoiKhoaBieu> findByGiaoVienIdAndHocKyAndNamHoc(Integer giaoVienId, Integer hocKy, String namHoc);
    List<ThoiKhoaBieu> findByLopId(Integer lopId);
}