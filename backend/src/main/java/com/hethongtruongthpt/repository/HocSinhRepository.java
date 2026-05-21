package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.HocSinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HocSinhRepository extends JpaRepository<HocSinh, Integer> {
    Optional<HocSinh> findByMaHocSinh(String maHocSinh);
    Optional<HocSinh> findByUserId(Integer userId);
    List<HocSinh> findByLopId(Integer lopId);
    List<HocSinh> findByNamNhapHoc(Integer namNhapHoc);
}