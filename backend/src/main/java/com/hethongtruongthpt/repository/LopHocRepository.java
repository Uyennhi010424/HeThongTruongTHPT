package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.LopHoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LopHocRepository extends JpaRepository<LopHoc, Integer> {
    Optional<LopHoc> findByTenLopAndNamHoc(String tenLop, String namHoc);
    List<LopHoc> findByKhoi(Integer khoi);
    List<LopHoc> findByNamHoc(String namHoc);
    List<LopHoc> findByGvcnId(Integer gvcnId);
    List<LopHoc> findByToHopId(Integer toHopId);
    long countByToHopId(Integer toHopId);
}