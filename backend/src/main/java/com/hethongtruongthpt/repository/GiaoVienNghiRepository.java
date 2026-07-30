package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.GiaoVienNghi;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface GiaoVienNghiRepository extends JpaRepository<GiaoVienNghi, Integer> {
    @EntityGraph(attributePaths = {"giaoVien", "giaoVienThay", "approvedBy"})
    List<GiaoVienNghi> findAll();

    @EntityGraph(attributePaths = {"giaoVien", "giaoVienThay", "approvedBy"})
    List<GiaoVienNghi> findByNgay(LocalDate ngay);

    @EntityGraph(attributePaths = {"giaoVien", "giaoVienThay", "approvedBy"})
    List<GiaoVienNghi> findByNamHoc(String namHoc);
    @EntityGraph(attributePaths = {"giaoVien", "giaoVienThay", "approvedBy"})
    List<GiaoVienNghi> findByNgayAndNamHoc(LocalDate ngay, String namHoc);

    @EntityGraph(attributePaths = {"giaoVien", "giaoVienThay", "approvedBy"})
    Optional<GiaoVienNghi> findByGiaoVienIdAndNgay(Integer giaoVienId, LocalDate ngay);
    @EntityGraph(attributePaths = {"giaoVien", "giaoVienThay", "approvedBy"})
    List<GiaoVienNghi> findByGiaoVienIdAndNgayBetween(Integer giaoVienId, LocalDate from, LocalDate to);

    @EntityGraph(attributePaths = {"giaoVien", "giaoVienThay", "approvedBy"})
    List<GiaoVienNghi> findByGiaoVienId(Integer giaoVienId);

    @EntityGraph(attributePaths = {"giaoVien", "giaoVienThay", "approvedBy"})
    List<GiaoVienNghi> findByGiaoVienIdAndNamHoc(Integer giaoVienId, String namHoc);
    boolean existsByGiaoVienIdAndNgay(Integer giaoVienId, LocalDate ngay);
}
