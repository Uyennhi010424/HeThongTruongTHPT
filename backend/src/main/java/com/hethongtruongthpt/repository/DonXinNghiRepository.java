package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.DonXinNghi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonXinNghiRepository extends JpaRepository<DonXinNghi, Integer> {
    List<DonXinNghi> findByHocSinhIdOrderByCreatedAtDesc(Integer hocSinhId);
    List<DonXinNghi> findByPhuHuynhIdOrderByCreatedAtDesc(Integer phuHuynhId);
    List<DonXinNghi> findByHocSinhLopIdOrderByCreatedAtDesc(Integer lopId);
}
