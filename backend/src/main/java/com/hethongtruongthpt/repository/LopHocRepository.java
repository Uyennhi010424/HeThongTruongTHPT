package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.LopHoc;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LopHocRepository extends JpaRepository<LopHoc, Integer> {
    
    @EntityGraph(attributePaths = {"gvcn"})
    List<LopHoc> findAll();
    
    @EntityGraph(attributePaths = {"gvcn"})
    Page<LopHoc> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"gvcn"})
    Optional<LopHoc> findById(Integer id);

    @EntityGraph(attributePaths = {"gvcn"})
    Optional<LopHoc> findByTenLopAndNamHoc(String tenLop, String namHoc);

    @EntityGraph(attributePaths = {"gvcn"})
    List<LopHoc> findByKhoi(Integer khoi);

    @EntityGraph(attributePaths = {"gvcn"})
    List<LopHoc> findByNamHoc(String namHoc);

    @EntityGraph(attributePaths = {"gvcn"})
    List<LopHoc> findByGvcnId(Integer gvcnId);

    @EntityGraph(attributePaths = {"gvcn"})
    List<LopHoc> findByGvcnIdAndNamHoc(Integer gvcnId, String namHoc);

    @EntityGraph(attributePaths = {"gvcn"})
    List<LopHoc> findByToHop_Id(Integer toHopId);
    
    long countByToHop_Id(Integer toHopId);

    boolean existsByNamHoc(String namHoc);
}