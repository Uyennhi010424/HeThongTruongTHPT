package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.LichSuHocTap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface LichSuHocTapRepository extends JpaRepository<LichSuHocTap, Integer> {
    
    @EntityGraph(attributePaths = {"lopHoc"})
    List<LichSuHocTap> findByHocSinhIdOrderByNamHocDesc(Integer hocSinhId);
    
    List<LichSuHocTap> findByNamHoc(String namHoc);
    boolean existsByNamHoc(String namHoc);

    boolean existsByHocSinhIdAndNamHoc(Integer hocSinhId, String namHoc);

    @Query("SELECT COUNT(l) FROM LichSuHocTap l WHERE l.lopHoc.id = :lopId")
    long countByLopId(@Param("lopId") Integer lopId);

    @EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop"})
    @Query("SELECT l FROM LichSuHocTap l WHERE l.lopHoc.id = :lopId")
    List<LichSuHocTap> findByLopHocId(@Param("lopId") Integer lopId);
}
