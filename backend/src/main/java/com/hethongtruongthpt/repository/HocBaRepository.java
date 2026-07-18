package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.HocBa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HocBaRepository extends JpaRepository<HocBa, Integer> {
    List<HocBa> findByHocSinhId(Integer hocSinhId);
    List<HocBa> findByNamHocId(Integer namHocId);
    Optional<HocBa> findByHocSinhIdAndNamHocId(Integer hocSinhId, Integer namHocId);
    List<HocBa> findByHocSinhLopId(Integer lopId);

    boolean existsByNamHocId(Integer namHocId);
}
