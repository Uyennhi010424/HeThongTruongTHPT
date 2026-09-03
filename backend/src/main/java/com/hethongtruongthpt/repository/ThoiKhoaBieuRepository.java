package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;


import java.util.List;

@Repository
public interface ThoiKhoaBieuRepository extends JpaRepository<ThoiKhoaBieu, Integer> {
    @EntityGraph(attributePaths = {"monHoc", "giaoVien", "lop"})
    List<ThoiKhoaBieu> findByLopIdAndHocKyAndNamHoc(Integer lopId, Integer hocKy, String namHoc);
    List<ThoiKhoaBieu> findByGiaoVienIdAndHocKyAndNamHoc(Integer giaoVienId, Integer hocKy, String namHoc);
    @EntityGraph(attributePaths = {"monHoc", "giaoVien", "lop"})
    List<ThoiKhoaBieu> findByLopId(Integer lopId);
    @EntityGraph(attributePaths = {"monHoc", "giaoVien", "lop"})
    List<ThoiKhoaBieu> findByNamHocAndHocKy(String namHoc, Integer hocKy);
    List<ThoiKhoaBieu> findByGiaoVienId(Integer giaoVienId);

    // Queries with week number
    @EntityGraph(attributePaths = {"monHoc", "giaoVien", "lop"})
    List<ThoiKhoaBieu> findByLopIdAndHocKyAndNamHocAndTuan(Integer lopId, Integer hocKy, String namHoc, Integer tuan);
    @EntityGraph(attributePaths = {"monHoc", "giaoVien", "lop"})
    List<ThoiKhoaBieu> findByLopIdAndNamHocAndTuan(Integer lopId, String namHoc, Integer tuan);
    @EntityGraph(attributePaths = {"monHoc", "giaoVien", "lop"})
    List<ThoiKhoaBieu> findByLopIdAndTuan(Integer lopId, Integer tuan);
    @EntityGraph(attributePaths = {"monHoc", "giaoVien", "lop"})
    List<ThoiKhoaBieu> findByNamHocAndHocKyAndTuan(String namHoc, Integer hocKy, Integer tuan);
    @EntityGraph(attributePaths = {"monHoc", "giaoVien", "lop"})
    List<ThoiKhoaBieu> findByTuan(Integer tuan);
    
    void deleteByNamHocAndHocKyAndTuan(String namHoc, Integer hocKy, Integer tuan);
    @EntityGraph(attributePaths = {"monHoc", "giaoVien", "lop"})
    List<ThoiKhoaBieu> findByGiaoVienIdAndHocKyAndNamHocAndTuan(Integer giaoVienId, Integer hocKy, String namHoc, Integer tuan);

    // Find by class and time slot
    @EntityGraph(attributePaths = {"monHoc", "giaoVien", "lop"})
    List<ThoiKhoaBieu> findByLopIdAndThuAndTietBatDau(Integer lopId, Integer thu, Integer tietBatDau);

    // Delete by filter
    void deleteByNamHocAndHocKy(String namHoc, Integer hocKy);
}