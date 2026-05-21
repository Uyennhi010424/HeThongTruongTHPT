package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.Diem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiemRepository extends JpaRepository<Diem, Integer> {
    List<Diem> findByHocSinhIdAndMonHocId(Integer hocSinhId, Integer monHocId);
    List<Diem> findByHocKyAndNamHoc(Integer hocKy, String namHoc);
    List<Diem> findByStatus(String status);
}