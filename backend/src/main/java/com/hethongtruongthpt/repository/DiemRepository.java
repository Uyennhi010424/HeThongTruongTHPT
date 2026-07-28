package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.Diem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;


import java.util.List;
import java.util.Map;

@Repository
public interface DiemRepository extends JpaRepository<Diem, Integer> {
    @EntityGraph(attributePaths = {"hocSinh", "monHoc", "giaoVienNhap"})
    List<Diem> findByHocSinhIdAndMonHocId(Integer hocSinhId, Integer monHocId);
    @EntityGraph(attributePaths = {"hocSinh", "monHoc", "giaoVienNhap"})
    List<Diem> findByHocSinhId(Integer hocSinhId);
    void deleteByPhanCongDayId(Integer phanCongDayId);

    @Query("DELETE FROM Diem d WHERE d.phanCongDay.id IN :ids")
    @org.springframework.data.jpa.repository.Modifying
    void deleteByPhanCongDayIdIn(@Param("ids") List<Integer> phanCongDayIds);
    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "monHoc", "giaoVienNhap"})
    List<Diem> findByHocKyAndNamHoc(Integer hocKy, String namHoc);
    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "monHoc", "giaoVienNhap"})
    List<Diem> findByHocSinhIdAndHocKyAndNamHoc(Integer hocSinhId, Integer hocKy, String namHoc);
    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "monHoc", "giaoVienNhap"})
    List<Diem> findByHocSinhLopIdAndHocKyAndNamHoc(Integer lopId, Integer hocKy, String namHoc);
    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "monHoc", "giaoVienNhap"})
    List<Diem> findByNamHoc(String namHoc);
    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "monHoc", "giaoVienNhap"})
    List<Diem> findByStatus(String status);
    boolean existsByGiaoVienNhapId(Integer giaoVienNhapId);
    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "monHoc", "giaoVienNhap"})
    List<Diem> findByGiaoVienNhapIdAndHocKyAndNamHoc(Integer giaoVienNhapId, Integer hocKy, String namHoc);
    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "monHoc", "giaoVienNhap"})
    List<Diem> findByGiaoVienNhapIdAndNamHoc(Integer giaoVienNhapId, String namHoc);
    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "monHoc", "giaoVienNhap"})
    List<Diem> findByHocSinhIdAndNamHoc(Integer hocSinhId, String namHoc);
    
    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "monHoc", "giaoVienNhap"})
    List<Diem> findByHocSinhIdInAndNamHoc(List<Integer> hocSinhIds, String namHoc);

    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "monHoc", "giaoVienNhap"})
    Diem findByHocSinhIdAndMonHocIdAndLoaiDiemAndSoThuTuAndHocKyAndNamHoc(
            Integer hocSinhId, Integer monHocId, String loaiDiem,
            Integer soThuTu, Integer hocKy, String namHoc);

    // Không dùng AS aliases — để tên cột gốc (snake_case).
    // getVal() trong DiemService dùng equalsIgnoreCase nên match được cả camelCase lẫn snake_case.
    @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri as gia_tri, d.nhan_xet, hs.lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lop l ON l.id = hs.lop_id WHERE d.nam_hoc = :namHoc AND d.gia_tri IS NOT NULL", nativeQuery = true)
    List<Map<String, Object>> findSummaryByNamHoc(@Param("namHoc") String namHoc);

    @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri as gia_tri, d.nhan_xet, hs.lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lop l ON l.id = hs.lop_id WHERE d.nam_hoc = :namHoc AND hs.lop_id = :lopId AND d.gia_tri IS NOT NULL", nativeQuery = true)
    List<Map<String, Object>> findSummaryByNamHocAndLopId(@Param("namHoc") String namHoc, @Param("lopId") Integer lopId);

    @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri as gia_tri, d.nhan_xet, hs.lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lop l ON l.id = hs.lop_id WHERE d.nam_hoc = :namHoc AND d.hoc_ky = :hocKy AND d.gia_tri IS NOT NULL", nativeQuery = true)
    List<Map<String, Object>> findSummaryByNamHocAndHocKy(@Param("namHoc") String namHoc, @Param("hocKy") Integer hocKy);

    @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri as gia_tri, d.nhan_xet, hs.lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lop l ON l.id = hs.lop_id WHERE d.gia_tri IS NOT NULL", nativeQuery = true)
    List<Map<String, Object>> findSummaryAll();

    @Query(value = "SELECT " +
            "l.id as lopId, " +
            "l.ten_lop as tenLop, " +
            "g.ho_ten as tenGvcn, " +
            "COALESCE(hs_agg.siSo, 0) as siSo, " +
            "CASE WHEN d_agg.enteredScores > 0 THEN 1 ELSE 0 END as hasScores, " +
            "COALESCE(pcd_agg.expectedScoresPerStudent, 0) as expectedScoresPerStudent, " +
            "COALESCE(d_agg.enteredScores, 0) as enteredScores " +
            "FROM lop l " +
            "LEFT JOIN giao_vien g ON l.gvcn_id = g.id " +
            "LEFT JOIN (SELECT lop_id, COUNT(id) as siSo FROM hoc_sinh WHERE trang_thai = 1 GROUP BY lop_id) hs_agg ON hs_agg.lop_id = l.id " +
            "LEFT JOIN (SELECT hs.lop_id, COUNT(d.id) as enteredScores FROM diem d JOIN hoc_sinh hs ON d.hoc_sinh_id = hs.id WHERE d.nam_hoc = :namHoc AND d.hoc_ky = :hocKy AND (d.gia_tri IS NOT NULL OR d.nhan_xet IS NOT NULL) GROUP BY hs.lop_id) d_agg ON d_agg.lop_id = l.id " +
            "LEFT JOIN (SELECT pcd.lop_id, SUM(mh.so_dtx_hoc_ky + 2) as expectedScoresPerStudent FROM phan_cong_day pcd JOIN mon_hoc mh ON pcd.mon_hoc_id = mh.id WHERE pcd.nam_hoc = :namHoc AND pcd.hoc_ky = :hocKy GROUP BY pcd.lop_id) pcd_agg ON pcd_agg.lop_id = l.id", nativeQuery = true)
    List<Map<String, Object>> getProgressSummary(@Param("namHoc") String namHoc, @Param("hocKy") Integer hocKy);

    @Query(value = "SELECT " +
            "mh.id as monHocId, " +
            "mh.ten_mon as tenMon, " +
            "gv.ho_ten as tenGiaoVien, " +
            "COALESCE(hs_agg.siSo, 0) as siSo, " +
            "mh.so_dtx_hoc_ky as soDtxHocKy, " +
            "COALESCE(d_agg.enteredScores, 0) as enteredScores " +
            "FROM phan_cong_day pcd " +
            "JOIN mon_hoc mh ON pcd.mon_hoc_id = mh.id " +
            "LEFT JOIN giao_vien gv ON pcd.giao_vien_id = gv.id " +
            "LEFT JOIN (SELECT lop_id, COUNT(id) as siSo FROM hoc_sinh WHERE trang_thai = 1 AND lop_id = :lopId GROUP BY lop_id) hs_agg ON hs_agg.lop_id = pcd.lop_id " +
            "LEFT JOIN (SELECT d.mon_hoc_id, COUNT(d.id) as enteredScores FROM diem d JOIN hoc_sinh hs ON d.hoc_sinh_id = hs.id WHERE hs.lop_id = :lopId AND d.nam_hoc = :namHoc AND d.hoc_ky = :hocKy AND (d.gia_tri IS NOT NULL OR d.nhan_xet IS NOT NULL) GROUP BY d.mon_hoc_id) d_agg ON d_agg.mon_hoc_id = pcd.mon_hoc_id " +
            "WHERE pcd.lop_id = :lopId AND pcd.nam_hoc = :namHoc AND pcd.hoc_ky = :hocKy", nativeQuery = true)
    List<Map<String, Object>> getClassProgressSummary(@Param("namHoc") String namHoc, @Param("hocKy") Integer hocKy, @Param("lopId") Integer lopId);
}