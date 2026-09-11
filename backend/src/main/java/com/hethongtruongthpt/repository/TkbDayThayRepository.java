package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.TkbDayThay;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TkbDayThayRepository extends JpaRepository<TkbDayThay, Integer> {
    @EntityGraph(attributePaths = {"thoiKhoaBieu", "thoiKhoaBieu.lop", "thoiKhoaBieu.monHoc", "thoiKhoaBieu.giaoVien", "giaoVienThay"})
    List<TkbDayThay> findAll();

    @EntityGraph(attributePaths = {"thoiKhoaBieu", "thoiKhoaBieu.lop", "thoiKhoaBieu.monHoc", "thoiKhoaBieu.giaoVien", "giaoVienThay"})
    List<TkbDayThay> findByNgay(LocalDate ngay);

    @EntityGraph(attributePaths = {"thoiKhoaBieu", "thoiKhoaBieu.lop", "thoiKhoaBieu.monHoc", "thoiKhoaBieu.giaoVien", "giaoVienThay"})
    List<TkbDayThay> findByThoiKhoaBieuId(Integer tkbId);

    @EntityGraph(attributePaths = {"thoiKhoaBieu", "thoiKhoaBieu.lop", "thoiKhoaBieu.monHoc", "thoiKhoaBieu.giaoVien", "giaoVienThay"})
    List<TkbDayThay> findByGiaoVienThayIdAndNgay(Integer giaoVienThayId, LocalDate ngay);

    @EntityGraph(attributePaths = {"thoiKhoaBieu", "thoiKhoaBieu.lop", "thoiKhoaBieu.monHoc", "thoiKhoaBieu.giaoVien", "giaoVienThay"})
    List<TkbDayThay> findByNgayBetween(LocalDate from, LocalDate to);

    @EntityGraph(attributePaths = {"thoiKhoaBieu", "thoiKhoaBieu.lop", "thoiKhoaBieu.monHoc", "thoiKhoaBieu.giaoVien", "giaoVienThay"})
    @Query("SELECT d FROM TkbDayThay d WHERE d.ngay = :ngay AND d.thoiKhoaBieu.namHoc = :namHoc")
    List<TkbDayThay> findByNgayAndNamHoc(@Param("ngay") LocalDate ngay, @Param("namHoc") String namHoc);

    @EntityGraph(attributePaths = {"thoiKhoaBieu", "thoiKhoaBieu.lop", "thoiKhoaBieu.monHoc", "thoiKhoaBieu.giaoVien", "giaoVienThay"})
    @Query("SELECT d FROM TkbDayThay d WHERE d.ngay BETWEEN :from AND :to AND d.thoiKhoaBieu.namHoc = :namHoc")
    List<TkbDayThay> findByNgayBetweenAndNamHoc(@Param("from") LocalDate from, @Param("to") LocalDate to, @Param("namHoc") String namHoc);

    @EntityGraph(attributePaths = {"thoiKhoaBieu", "thoiKhoaBieu.lop", "thoiKhoaBieu.monHoc", "thoiKhoaBieu.giaoVien", "giaoVienThay"})
    @Query("SELECT d FROM TkbDayThay d WHERE d.thoiKhoaBieu.namHoc = :namHoc")
    List<TkbDayThay> findByNamHoc(@Param("namHoc") String namHoc);

    @EntityGraph(attributePaths = {"thoiKhoaBieu", "thoiKhoaBieu.lop", "thoiKhoaBieu.monHoc", "thoiKhoaBieu.giaoVien", "giaoVienThay"})
    @Query("SELECT d FROM TkbDayThay d WHERE d.giaoVienThay.id = :giaoVienId AND d.thoiKhoaBieu.namHoc = :namHoc")
    List<TkbDayThay> findByGiaoVienThayIdAndNamHoc(@Param("giaoVienId") Integer giaoVienId, @Param("namHoc") String namHoc);

    @EntityGraph(attributePaths = {"thoiKhoaBieu", "thoiKhoaBieu.lop", "thoiKhoaBieu.monHoc", "thoiKhoaBieu.giaoVien", "giaoVienThay"})
    @Query("SELECT d FROM TkbDayThay d WHERE d.giaoVienThay.id = :giaoVienId AND d.ngay BETWEEN :from AND :to")
    List<TkbDayThay> findByGiaoVienThayIdAndNgayBetween(@Param("giaoVienId") Integer giaoVienId, @Param("from") LocalDate from, @Param("to") LocalDate to);
}
