package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.LichSuHocTap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface LichSuHocTapRepository extends JpaRepository<LichSuHocTap, Integer> {
    
    @EntityGraph(attributePaths = {"lopHoc"})
    List<LichSuHocTap> findByHocSinhIdOrderByNamHocDesc(Integer hocSinhId);
    
    boolean existsByHocSinhIdAndNamHoc(Integer hocSinhId, String namHoc);
}
