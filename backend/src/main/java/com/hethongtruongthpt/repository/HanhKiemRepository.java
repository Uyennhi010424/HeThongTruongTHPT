package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.HanhKiem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HanhKiemRepository extends JpaRepository<HanhKiem, Integer> {

    List<HanhKiem> findByHocSinhId(Integer hocSinhId);

    List<HanhKiem> findByGiaoVienId(Integer giaoVienId);

    List<HanhKiem> findByHocSinhIdAndNamHocId(Integer hocSinhId, Integer namHocId);

    List<HanhKiem> findByHocSinhLopIdAndNamHocId(Integer lopId, Integer namHocId);

    List<HanhKiem> findByHocSinhLopId(Integer lopId);

    Optional<HanhKiem> findByHocSinhIdAndNamHocIdAndHocKy(Integer hocSinhId, Integer namHocId, Integer hocKy);

    boolean existsByNamHocId(Integer namHocId);
}
