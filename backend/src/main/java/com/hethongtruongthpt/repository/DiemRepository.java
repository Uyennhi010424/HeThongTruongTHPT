package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.Diem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface DiemRepository extends JpaRepository<Diem, Integer> {
    List<Diem> findByHocSinhIdAndMonHocId(Integer hocSinhId, Integer monHocId);
    List<Diem> findByHocSinhId(Integer hocSinhId);
    void deleteByPhanCongDayId(Integer phanCongDayId);

    @Query("DELETE FROM Diem d WHERE d.phanCongDay.id IN :ids")
    @org.springframework.data.jpa.repository.Modifying
    void deleteByPhanCongDayIdIn(@Param("ids") List<Integer> phanCongDayIds);
    List<Diem> findByHocKyAndNamHoc(Integer hocKy, String namHoc);
    List<Diem> findByNamHoc(String namHoc);
    List<Diem> findByStatus(String status);
    boolean existsByGiaoVienNhapId(Integer giaoVienNhapId);
    List<Diem> findByGiaoVienNhapIdAndHocKyAndNamHoc(Integer giaoVienNhapId, Integer hocKy, String namHoc);
    List<Diem> findByGiaoVienNhapIdAndNamHoc(Integer giaoVienNhapId, String namHoc);
    List<Diem> findByHocSinhIdAndNamHoc(Integer hocSinhId, String namHoc);

    Diem findByHocSinhIdAndMonHocIdAndLoaiDiemAndSoThuTuAndHocKyAndNamHoc(
            Integer hocSinhId, Integer monHocId, String loaiDiem,
            Integer soThuTu, Integer hocKy, String namHoc);

    // Không dùng AS aliases — để tên cột gốc (snake_case).
    // getVal() trong DiemService dùng equalsIgnoreCase nên match được cả camelCase lẫn snake_case.
    @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri, d.nhan_xet, hs.lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lop l ON l.id = hs.lop_id WHERE d.nam_hoc = :namHoc AND d.gia_tri IS NOT NULL", nativeQuery = true)
    List<Map<String, Object>> findSummaryByNamHoc(@Param("namHoc") String namHoc);

    @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri, d.nhan_xet, hs.lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lop l ON l.id = hs.lop_id WHERE d.nam_hoc = :namHoc AND hs.lop_id = :lopId AND d.gia_tri IS NOT NULL", nativeQuery = true)
    List<Map<String, Object>> findSummaryByNamHocAndLopId(@Param("namHoc") String namHoc, @Param("lopId") Integer lopId);

    @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri, d.nhan_xet, hs.lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lop l ON l.id = hs.lop_id WHERE d.nam_hoc = :namHoc AND d.hoc_ky = :hocKy AND d.gia_tri IS NOT NULL", nativeQuery = true)
    List<Map<String, Object>> findSummaryByNamHocAndHocKy(@Param("namHoc") String namHoc, @Param("hocKy") Integer hocKy);

    @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri, d.nhan_xet, hs.lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lop l ON l.id = hs.lop_id WHERE d.gia_tri IS NOT NULL", nativeQuery = true)
    List<Map<String, Object>> findSummaryAll();
}