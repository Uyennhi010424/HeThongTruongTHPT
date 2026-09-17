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
    @Query("SELECT d FROM Diem d WHERE (d.phanCongDay.lop.id = :lopId OR d.hocSinh.lop.id = :lopId OR d.hocSinh.id IN (SELECT ls.hocSinh.id FROM LichSuHocTap ls WHERE ls.lopHoc.id = :lopId AND ls.namHoc = :namHoc)) AND d.hocKy = :hocKy AND d.namHoc = :namHoc")
    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "monHoc", "giaoVienNhap", "phanCongDay"})
    List<Diem> findByHocSinhLopIdAndHocKyAndNamHoc(@Param("lopId") Integer lopId, @Param("hocKy") Integer hocKy, @Param("namHoc") String namHoc);

    @Query("SELECT DISTINCT d.hocSinh.id FROM Diem d WHERE (d.phanCongDay.lop.id = :lopId OR d.hocSinh.lop.id = :lopId OR d.hocSinh.id IN (SELECT ls.hocSinh.id FROM LichSuHocTap ls WHERE ls.lopHoc.id = :lopId AND ls.namHoc = :namHoc)) AND d.namHoc = :namHoc")
    List<Integer> findDistinctHocSinhIdsByLopIdAndNamHoc(@Param("lopId") Integer lopId, @Param("namHoc") String namHoc);

    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "monHoc", "giaoVienNhap"})
    List<Diem> findByNamHoc(String namHoc);
    boolean existsByNamHoc(String namHoc);
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
    @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri as gia_tri, d.nhan_xet, COALESCE(ls.lop_id, hs.lop_id) as lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lich_su_hoc_tap ls ON ls.hoc_sinh_id = d.hoc_sinh_id AND ls.nam_hoc = d.nam_hoc LEFT JOIN lop l ON l.id = COALESCE(ls.lop_id, hs.lop_id) WHERE d.nam_hoc = :namHoc AND d.gia_tri IS NOT NULL AND (l.is_deleted = false OR l.is_deleted IS NULL)", nativeQuery = true)
    List<com.hethongtruongthpt.dto.DiemSummaryDTO> findSummaryByNamHoc(@Param("namHoc") String namHoc);

    @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri as gia_tri, d.nhan_xet, COALESCE(ls.lop_id, hs.lop_id) as lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lich_su_hoc_tap ls ON ls.hoc_sinh_id = d.hoc_sinh_id AND ls.nam_hoc = d.nam_hoc LEFT JOIN lop l ON l.id = COALESCE(ls.lop_id, hs.lop_id) WHERE d.nam_hoc = :namHoc AND COALESCE(ls.lop_id, hs.lop_id) = :lopId AND d.gia_tri IS NOT NULL AND (l.is_deleted = false OR l.is_deleted IS NULL)", nativeQuery = true)
    List<com.hethongtruongthpt.dto.DiemSummaryDTO> findSummaryByNamHocAndLopId(@Param("namHoc") String namHoc, @Param("lopId") Integer lopId);

    @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri as gia_tri, d.nhan_xet, COALESCE(ls.lop_id, hs.lop_id) as lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lich_su_hoc_tap ls ON ls.hoc_sinh_id = d.hoc_sinh_id AND ls.nam_hoc = d.nam_hoc LEFT JOIN lop l ON l.id = COALESCE(ls.lop_id, hs.lop_id) WHERE d.nam_hoc = :namHoc AND d.hoc_ky = :hocKy AND d.gia_tri IS NOT NULL AND (l.is_deleted = false OR l.is_deleted IS NULL)", nativeQuery = true)
    List<com.hethongtruongthpt.dto.DiemSummaryDTO> findSummaryByNamHocAndHocKy(@Param("namHoc") String namHoc, @Param("hocKy") Integer hocKy);

    @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri as gia_tri, d.nhan_xet, COALESCE(ls.lop_id, hs.lop_id) as lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lich_su_hoc_tap ls ON ls.hoc_sinh_id = d.hoc_sinh_id AND ls.nam_hoc = d.nam_hoc LEFT JOIN lop l ON l.id = COALESCE(ls.lop_id, hs.lop_id) WHERE d.gia_tri IS NOT NULL AND (l.is_deleted = false OR l.is_deleted IS NULL)", nativeQuery = true)
    List<com.hethongtruongthpt.dto.DiemSummaryDTO> findSummaryAll();

    /**
     * Tính ĐTB theo khối trực tiếp trong DB (aggregation at DB level).
     * Trả về [{khoi, avgScore, studentCount}] thay vì kéo toàn bộ raw data lên Java.
     * Logic: Tính ĐTB từng học sinh theo môn -> ĐTB từng học sinh -> ĐTB theo khối.
     */
    @Query(value = "SELECT subq.khoi, COUNT(*) as studentCount, ROUND(AVG(subq.avg_per_student), 2) as avgScore " +
            "FROM ( " +
            "  SELECT d.hoc_sinh_id, AVG(d.gia_tri) as avg_per_student, l.khoi " +
            "  FROM diem d " +
            "  INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id " +
            "  LEFT JOIN lich_su_hoc_tap ls ON ls.hoc_sinh_id = d.hoc_sinh_id AND ls.nam_hoc = :namHoc " +
            "  LEFT JOIN lop l ON l.id = COALESCE(ls.lop_id, hs.lop_id) " +
            "  WHERE d.nam_hoc = :namHoc AND d.gia_tri IS NOT NULL " +
            "  AND (l.is_deleted = false OR l.is_deleted IS NULL) " +
            "  GROUP BY d.hoc_sinh_id, l.khoi " +
            ") subq " +
            "WHERE subq.khoi IS NOT NULL " +
            "GROUP BY subq.khoi " +
            "ORDER BY subq.khoi", nativeQuery = true)
    List<Map<String, Object>> findAvgScoreByGradeNative(@Param("namHoc") String namHoc);

    /**
     * Lấy GPA từng học sinh (chỉ cần avg_score và khoi) để phân bố điểm trong dashboard.
     * Trả về số rows = số học sinh, không phải số lượng điểm.
     */
    @Query(value = "SELECT " +
            "  d.hoc_sinh_id, " +
            "  ROUND(AVG(d.gia_tri), 2) as avg_score, " +
            "  l.khoi " +
            "FROM diem d " +
            "INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id " +
            "LEFT JOIN lich_su_hoc_tap ls ON ls.hoc_sinh_id = d.hoc_sinh_id AND ls.nam_hoc = :namHoc " +
            "LEFT JOIN lop l ON l.id = COALESCE(ls.lop_id, hs.lop_id) " +
            "WHERE d.nam_hoc = :namHoc AND d.gia_tri IS NOT NULL " +
            "AND (l.is_deleted = false OR l.is_deleted IS NULL) " +
            "GROUP BY d.hoc_sinh_id, l.khoi", nativeQuery = true)
    List<Map<String, Object>> findStudentGPAsForDistribution(@Param("namHoc") String namHoc);

    /**
     * Lấy GPA từng học sinh theo học kỳ cụ thể để phân bố điểm.
     */
    @Query(value = "SELECT " +
            "  d.hoc_sinh_id, " +
            "  ROUND(AVG(d.gia_tri), 2) as avg_score, " +
            "  l.khoi " +
            "FROM diem d " +
            "INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id " +
            "LEFT JOIN lich_su_hoc_tap ls ON ls.hoc_sinh_id = d.hoc_sinh_id AND ls.nam_hoc = :namHoc " +
            "LEFT JOIN lop l ON l.id = COALESCE(ls.lop_id, hs.lop_id) " +
            "WHERE d.nam_hoc = :namHoc AND d.hoc_ky = :hocKy AND d.gia_tri IS NOT NULL " +
            "AND (l.is_deleted = false OR l.is_deleted IS NULL) " +
            "GROUP BY d.hoc_sinh_id, l.khoi", nativeQuery = true)
    List<Map<String, Object>> findStudentGPAsForDistributionByHocKy(@Param("namHoc") String namHoc, @Param("hocKy") Integer hocKy);

    /**
     * Tính ĐTB theo môn học trực tiếp trong DB.
     * Trả về ~15-20 rows (1 per subject) thay vì 47,880 records raw.
     */
    @Query(value = "SELECT " +
            "  d.mon_hoc_id, " +
            "  mh.ten_mon, " +
            "  mh.nhom_danh_gia, " +
            "  ROUND(AVG(d.gia_tri), 2) as avg_score, " +
            "  COUNT(DISTINCT d.hoc_sinh_id) as student_count " +
            "FROM diem d " +
            "INNER JOIN mon_hoc mh ON mh.id = d.mon_hoc_id AND (mh.is_deleted = false OR mh.is_deleted IS NULL) " +
            "WHERE d.nam_hoc = :namHoc AND d.gia_tri IS NOT NULL " +
            "GROUP BY d.mon_hoc_id, mh.ten_mon, mh.nhom_danh_gia " +
            "ORDER BY mh.ten_mon", nativeQuery = true)
    List<Map<String, Object>> findSubjectAvgByNamHoc(@Param("namHoc") String namHoc);

    @Query(value = "SELECT " +
            "  d.mon_hoc_id, " +
            "  mh.ten_mon, " +
            "  mh.nhom_danh_gia, " +
            "  ROUND(AVG(d.gia_tri), 2) as avg_score, " +
            "  COUNT(DISTINCT d.hoc_sinh_id) as student_count " +
            "FROM diem d " +
            "INNER JOIN mon_hoc mh ON mh.id = d.mon_hoc_id AND (mh.is_deleted = false OR mh.is_deleted IS NULL) " +
            "WHERE d.nam_hoc = :namHoc AND d.hoc_ky = :hocKy AND d.gia_tri IS NOT NULL " +
            "GROUP BY d.mon_hoc_id, mh.ten_mon, mh.nhom_danh_gia " +
            "ORDER BY mh.ten_mon", nativeQuery = true)
    List<Map<String, Object>> findSubjectAvgByNamHocAndHocKy(@Param("namHoc") String namHoc, @Param("hocKy") Integer hocKy);

    @Query(value = "SELECT hs.lop_id as classId, l.ten_lop as tenLop, l.khoi as khoi, l.si_so as siSo, " +
            "COUNT(d.id) as totalScores, " +
            "ROUND(AVG(d.gia_tri), 2) as avg, " +
            "SUM(CASE WHEN d.gia_tri >= 8.0 THEN 1 ELSE 0 END) as tot, " +
            "SUM(CASE WHEN d.gia_tri >= 6.5 AND d.gia_tri < 8.0 THEN 1 ELSE 0 END) as kha, " +
            "SUM(CASE WHEN d.gia_tri >= 5.0 AND d.gia_tri < 6.5 THEN 1 ELSE 0 END) as dat, " +
            "SUM(CASE WHEN d.gia_tri < 5.0 THEN 1 ELSE 0 END) as chuaDat " +
            "FROM diem d " +
            "JOIN hoc_sinh hs ON d.hoc_sinh_id = hs.id " +
            "JOIN lop l ON hs.lop_id = l.id " +
            "JOIN phan_cong_day pcd ON pcd.lop_id = hs.lop_id AND pcd.mon_hoc_id = d.mon_hoc_id AND pcd.nam_hoc = d.nam_hoc " +
            "WHERE pcd.giao_vien_id = :giaoVienId AND d.nam_hoc = :namHoc AND d.gia_tri IS NOT NULL AND (l.is_deleted = false OR l.is_deleted IS NULL) " +
            "GROUP BY hs.lop_id, l.ten_lop, l.khoi, l.si_so", nativeQuery = true)
    List<Map<String, Object>> findTeacherReportStats(@Param("namHoc") String namHoc, @Param("giaoVienId") Integer giaoVienId);

    @Query("SELECT d FROM Diem d " +
           "JOIN FETCH d.hocSinh hs " +
           "LEFT JOIN FETCH hs.lop l " +
           "JOIN FETCH d.monHoc " +
           "WHERE d.hocKy = :hocKy AND d.namHoc = :namHoc " +
           "AND d.id NOT IN :sentIds")
    List<Diem> findDiemChuaGuiByHocKyAndNamHoc(@Param("hocKy") Integer hocKy, @Param("namHoc") String namHoc, @Param("sentIds") java.util.Collection<Integer> sentIds);

    @Query("SELECT d FROM Diem d " +
           "JOIN FETCH d.hocSinh hs " +
           "LEFT JOIN FETCH hs.lop l " +
           "JOIN FETCH d.monHoc " +
           "WHERE d.hocKy = :hocKy AND d.namHoc = :namHoc")
    List<Diem> findAllDiemByHocKyAndNamHoc(@Param("hocKy") Integer hocKy, @Param("namHoc") String namHoc);

    @Query("SELECT d FROM Diem d " +
           "JOIN FETCH d.hocSinh hs " +
           "LEFT JOIN FETCH hs.lop l " +
           "JOIN FETCH d.monHoc mh " +
           "WHERE d.namHoc = :namHoc AND d.hocKy = :hocKy " +
           "AND d.status = 'LOCKED' " +
           "AND d.id NOT IN :sentIds " +
           "AND (d.giaTriDiem IS NOT NULL OR d.nhanXet IS NOT NULL)")
    List<Diem> findPendingDiemWithRelations(@Param("namHoc") String namHoc,
                                            @Param("hocKy") Integer hocKy,
                                            @Param("sentIds") List<Integer> sentIds);

    @Query(value = "SELECT " +
            "l.id as lopId, " +
            "l.ten_lop as tenLop, " +
            "COALESCE(g.ho_ten, 'Chưa gán') as tenGvcn, " +
            "COALESCE(hs_agg.siSo, d_hs_agg.siSo, l.si_so, 0) as siSo, " +
            "CASE WHEN d_agg.enteredScores > 0 THEN 1 ELSE 0 END as hasScores, " +
            "COALESCE(pcd_agg.expectedScoresPerStudent, 0) as expectedScoresPerStudent, " +
            "COALESCE(d_agg.enteredScores, 0) as enteredScores " +
            "FROM lop l " +
            "LEFT JOIN giao_vien g ON l.gvcn_id = g.id AND (g.is_deleted = false OR g.is_deleted IS NULL) " +
            "LEFT JOIN (SELECT lop_id, COUNT(id) as siSo FROM hoc_sinh WHERE trang_thai = 1 GROUP BY lop_id) hs_agg ON hs_agg.lop_id = l.id " +
            "LEFT JOIN (SELECT pcd.lop_id, COUNT(DISTINCT d.hoc_sinh_id) as siSo FROM diem d JOIN phan_cong_day pcd ON d.phan_cong_day_id = pcd.id WHERE d.nam_hoc = :namHoc GROUP BY pcd.lop_id) d_hs_agg ON d_hs_agg.lop_id = l.id " +
            "LEFT JOIN (SELECT pcd.lop_id, COUNT(d.id) as enteredScores FROM diem d JOIN phan_cong_day pcd ON d.phan_cong_day_id = pcd.id WHERE d.nam_hoc = :namHoc AND d.hoc_ky = :hocKy AND (d.gia_tri IS NOT NULL OR d.nhan_xet IS NOT NULL) GROUP BY pcd.lop_id) d_agg ON d_agg.lop_id = l.id " +
            "LEFT JOIN (SELECT pcd.lop_id, SUM(mh.so_dtx_hoc_ky + 2) as expectedScoresPerStudent FROM phan_cong_day pcd JOIN mon_hoc mh ON pcd.mon_hoc_id = mh.id WHERE pcd.nam_hoc = :namHoc AND pcd.hoc_ky = :hocKy AND (mh.is_deleted = false OR mh.is_deleted IS NULL) GROUP BY pcd.lop_id) pcd_agg ON pcd_agg.lop_id = l.id " +
            "WHERE (l.is_deleted = false OR l.is_deleted IS NULL) AND l.nam_hoc = :namHoc " +
            "ORDER BY l.khoi ASC, l.ten_lop ASC", nativeQuery = true)
    List<Map<String, Object>> getProgressSummary(@Param("namHoc") String namHoc, @Param("hocKy") Integer hocKy);

    @Query(value = "SELECT " +
            "mh.id as monHocId, " +
            "mh.ten_mon as tenMon, " +
            "gv.ho_ten as tenGiaoVien, " +
            "COALESCE(NULLIF(hs_agg.siSo, 0), NULLIF(d_hs_agg.siSo, 0), NULLIF(l.si_so, 0), 0) as siSo, " +
            "mh.so_dtx_hoc_ky as soDtxHocKy, " +
            "COALESCE(d_agg.enteredScores, 0) as enteredScores " +
            "FROM phan_cong_day pcd " +
            "JOIN lop l ON pcd.lop_id = l.id " +
            "JOIN mon_hoc mh ON pcd.mon_hoc_id = mh.id AND (mh.is_deleted = false OR mh.is_deleted IS NULL) " +
            "LEFT JOIN giao_vien gv ON pcd.giao_vien_id = gv.id AND (gv.is_deleted = false OR gv.is_deleted IS NULL) " +
            "LEFT JOIN (SELECT lop_id, COUNT(id) as siSo FROM hoc_sinh WHERE trang_thai = 1 AND lop_id = :lopId GROUP BY lop_id) hs_agg ON hs_agg.lop_id = pcd.lop_id " +
            "LEFT JOIN (SELECT pcd2.lop_id, COUNT(DISTINCT d.hoc_sinh_id) as siSo FROM diem d JOIN phan_cong_day pcd2 ON d.phan_cong_day_id = pcd2.id WHERE pcd2.lop_id = :lopId AND d.nam_hoc = :namHoc GROUP BY pcd2.lop_id) d_hs_agg ON d_hs_agg.lop_id = pcd.lop_id " +
            "LEFT JOIN (SELECT d.mon_hoc_id, COUNT(d.id) as enteredScores FROM diem d JOIN phan_cong_day pcd3 ON d.phan_cong_day_id = pcd3.id WHERE pcd3.lop_id = :lopId AND d.nam_hoc = :namHoc AND d.hoc_ky = :hocKy AND (d.gia_tri IS NOT NULL OR d.nhan_xet IS NOT NULL) GROUP BY d.mon_hoc_id) d_agg ON d_agg.mon_hoc_id = pcd.mon_hoc_id " +
            "WHERE pcd.lop_id = :lopId AND pcd.nam_hoc = :namHoc AND pcd.hoc_ky = :hocKy", nativeQuery = true)
    List<Map<String, Object>> getClassProgressSummary(@Param("namHoc") String namHoc, @Param("hocKy") Integer hocKy, @Param("lopId") Integer lopId);
}