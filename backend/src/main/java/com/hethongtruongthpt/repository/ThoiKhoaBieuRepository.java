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
    List<ThoiKhoaBieu> findByNamHocAndHocKy(String namHoc, Integer hocKy);
    List<ThoiKhoaBieu> findByGiaoVienId(Integer giaoVienId);

    // Queries with week number
    List<ThoiKhoaBieu> findByLopIdAndHocKyAndNamHocAndTuan(Integer lopId, Integer hocKy, String namHoc, Integer tuan);
    List<ThoiKhoaBieu> findByLopIdAndNamHocAndTuan(Integer lopId, String namHoc, Integer tuan);
    List<ThoiKhoaBieu> findByLopIdAndTuan(Integer lopId, Integer tuan);
    List<ThoiKhoaBieu> findByNamHocAndHocKyAndTuan(String namHoc, Integer hocKy, Integer tuan);
    List<ThoiKhoaBieu> findByGiaoVienIdAndHocKyAndNamHocAndTuan(Integer giaoVienId, Integer hocKy, String namHoc, Integer tuan);

    // Find by class and time slot
    List<ThoiKhoaBieu> findByLopIdAndThuAndTietBatDau(Integer lopId, Integer thu, Integer tietBatDau);

    // Delete by filter
    void deleteByNamHocAndHocKy(String namHoc, Integer hocKy);
    void deleteByNamHocAndHocKyAndTuan(String namHoc, Integer hocKy, Integer tuan);
}