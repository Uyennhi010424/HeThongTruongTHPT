package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.CauHoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CauHoiRepository extends JpaRepository<CauHoi, Integer> {
    List<CauHoi> findByBaiKiemTraId(Integer baiKiemTraId);
}
