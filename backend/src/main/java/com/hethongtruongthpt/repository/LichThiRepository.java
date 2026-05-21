package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.LichThi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LichThiRepository extends JpaRepository<LichThi, Integer> {
    List<LichThi> findByLopIdAndHocKyAndNamHoc(Integer lopId, Integer hocKy, String namHoc);
    List<LichThi> findByNgayThiBetween(LocalDate startDate, LocalDate endDate);
    List<LichThi> findByLoaiKiemTra(String loaiKiemTra);
}