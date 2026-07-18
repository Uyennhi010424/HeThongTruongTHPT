package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.TkbDayThay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TkbDayThayRepository extends JpaRepository<TkbDayThay, Integer> {
    List<TkbDayThay> findByNgay(LocalDate ngay);
    List<TkbDayThay> findByThoiKhoaBieuId(Integer tkbId);
    List<TkbDayThay> findByGiaoVienThayIdAndNgay(Integer giaoVienThayId, LocalDate ngay);
    List<TkbDayThay> findByNgayBetween(LocalDate from, LocalDate to);

    @Query("SELECT d FROM TkbDayThay d WHERE d.ngay = :ngay AND d.thoiKhoaBieu.namHoc = :namHoc")
    List<TkbDayThay> findByNgayAndNamHoc(@Param("ngay") LocalDate ngay, @Param("namHoc") String namHoc);

    @Query("SELECT d FROM TkbDayThay d WHERE d.ngay BETWEEN :from AND :to AND d.thoiKhoaBieu.namHoc = :namHoc")
    List<TkbDayThay> findByNgayBetweenAndNamHoc(@Param("from") LocalDate from, @Param("to") LocalDate to, @Param("namHoc") String namHoc);
}
