package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.GiaoVienNghi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface GiaoVienNghiRepository extends JpaRepository<GiaoVienNghi, Integer> {
    List<GiaoVienNghi> findByNgay(LocalDate ngay);
    List<GiaoVienNghi> findByNamHoc(String namHoc);
    List<GiaoVienNghi> findByNgayAndNamHoc(LocalDate ngay, String namHoc);
    Optional<GiaoVienNghi> findByGiaoVienIdAndNgay(Integer giaoVienId, LocalDate ngay);
    List<GiaoVienNghi> findByGiaoVienIdAndNgayBetween(Integer giaoVienId, LocalDate from, LocalDate to);
    List<GiaoVienNghi> findByGiaoVienId(Integer giaoVienId);
    List<GiaoVienNghi> findByGiaoVienIdAndNamHoc(Integer giaoVienId, String namHoc);
    boolean existsByGiaoVienIdAndNgay(Integer giaoVienId, LocalDate ngay);
}
