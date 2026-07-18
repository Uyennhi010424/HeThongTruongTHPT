package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.DiemAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DiemAuditLogRepository extends JpaRepository<DiemAuditLog, Integer> {

    // JOIN FETCH queries — tránh N+1 lazy loading

    @Query("SELECT DISTINCT a FROM DiemAuditLog a "
            + "LEFT JOIN FETCH a.diem "
            + "LEFT JOIN FETCH a.hocSinh "
            + "LEFT JOIN FETCH a.monHoc "
            + "LEFT JOIN FETCH a.giaoVien "
            + "ORDER BY a.thoiGian DESC")
    List<DiemAuditLog> findAllWithDetails();

    @Query("SELECT DISTINCT a FROM DiemAuditLog a "
            + "LEFT JOIN FETCH a.diem "
            + "LEFT JOIN FETCH a.hocSinh "
            + "LEFT JOIN FETCH a.monHoc "
            + "LEFT JOIN FETCH a.giaoVien "
            + "WHERE a.diem.id = :diemId "
            + "ORDER BY a.thoiGian DESC")
    List<DiemAuditLog> findByDiemIdWithDetails(@Param("diemId") Integer diemId);

    @Query("SELECT DISTINCT a FROM DiemAuditLog a "
            + "LEFT JOIN FETCH a.diem "
            + "LEFT JOIN FETCH a.hocSinh "
            + "LEFT JOIN FETCH a.monHoc "
            + "LEFT JOIN FETCH a.giaoVien "
            + "WHERE a.hocSinh.id = :hocSinhId "
            + "AND (:monHocId IS NULL OR a.monHoc.id = :monHocId) "
            + "ORDER BY a.thoiGian DESC")
    List<DiemAuditLog> findByHocSinhIdWithDetails(
            @Param("hocSinhId") Integer hocSinhId,
            @Param("monHocId") Integer monHocId);

    @Query("SELECT DISTINCT a FROM DiemAuditLog a "
            + "LEFT JOIN FETCH a.diem "
            + "LEFT JOIN FETCH a.hocSinh "
            + "LEFT JOIN FETCH a.monHoc "
            + "LEFT JOIN FETCH a.giaoVien "
            + "WHERE a.giaoVien.id = :giaoVienId "
            + "ORDER BY a.thoiGian DESC")
    List<DiemAuditLog> findByGiaoVienIdWithDetails(@Param("giaoVienId") Integer giaoVienId);

    @Query("SELECT DISTINCT a FROM DiemAuditLog a "
            + "LEFT JOIN FETCH a.diem "
            + "LEFT JOIN FETCH a.hocSinh "
            + "LEFT JOIN FETCH a.monHoc "
            + "LEFT JOIN FETCH a.giaoVien "
            + "WHERE (:giaoVienId IS NULL OR a.giaoVien.id = :giaoVienId) "
            + "AND (:startDate IS NULL OR a.thoiGian >= :startDate) "
            + "AND (:endDate IS NULL OR a.thoiGian <= :endDate) "
            + "ORDER BY a.thoiGian DESC")
    List<DiemAuditLog> findFilteredWithDetails(
            @Param("giaoVienId") Integer giaoVienId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
