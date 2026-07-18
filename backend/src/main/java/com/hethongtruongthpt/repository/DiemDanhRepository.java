package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.DiemDanh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DiemDanhRepository extends JpaRepository<DiemDanh, Integer> {

    List<DiemDanh> findByNgayAndLopHocId(LocalDate ngay, Integer lopHocId);

    List<DiemDanh> findByNgayAndLopHocIdAndTietHoc(LocalDate ngay, Integer lopHocId, Integer tietHoc);

    boolean existsByNgayAndLopHocId(LocalDate ngay, Integer lopHocId);

    boolean existsByNgayAndLopHocIdAndTietHoc(LocalDate ngay, Integer lopHocId, Integer tietHoc);

    List<DiemDanh> findByLopHocIdAndNgayBetween(Integer lopHocId, LocalDate from, LocalDate to);

    List<DiemDanh> findByHocSinhIdAndNgayBetween(Integer hocSinhId, LocalDate from, LocalDate to);

    // Statistics: count absences per student in a class within date range
    @Query("SELECT d.hocSinh.id, d.hocSinh.hoTen, " +
           "SUM(CASE WHEN d.loaiVang = 'CO_PHEP' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN d.loaiVang = 'KHONG_PHEP' THEN 1 ELSE 0 END), " +
           "COUNT(d) " +
           "FROM DiemDanh d " +
           "WHERE d.lopHoc.id = :lopId AND d.ngay BETWEEN :from AND :to " +
           "GROUP BY d.hocSinh.id, d.hocSinh.hoTen")
    List<Object[]> getAbsenceStatsByLop(@Param("lopId") Integer lopId,
                                         @Param("from") LocalDate from,
                                         @Param("to") LocalDate to);

    // Statistics: total attendance days for a class within date range
    @Query("SELECT COUNT(DISTINCT d.ngay) FROM DiemDanh d " +
           "WHERE d.lopHoc.id = :lopId AND d.ngay BETWEEN :from AND :to")
    long countTotalDaysByLop(@Param("lopId") Integer lopId,
                              @Param("from") LocalDate from,
                              @Param("to") LocalDate to);

    // Statistics: count by loaiVang for a student
    @Query("SELECT d.loaiVang, COUNT(d) FROM DiemDanh d " +
           "WHERE d.hocSinh.id = :hocSinhId AND d.ngay BETWEEN :from AND :to " +
           "GROUP BY d.loaiVang")
    List<Object[]> countByLoaiVangAndHocSinh(@Param("hocSinhId") Integer hocSinhId,
                                              @Param("from") LocalDate from,
                                              @Param("to") LocalDate to);

    // Find absent students for SMS notification
    @Query("SELECT d FROM DiemDanh d " +
           "WHERE d.ngay = :ngay AND d.loaiVang IN ('CO_PHEP', 'KHONG_PHEP')")
    List<DiemDanh> findAbsentStudentsByNgay(@Param("ngay") LocalDate ngay);
}
