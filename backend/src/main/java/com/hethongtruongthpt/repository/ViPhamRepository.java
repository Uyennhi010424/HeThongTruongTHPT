package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.ViPham;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ViPhamRepository extends JpaRepository<ViPham, Integer> {
    List<ViPham> findByHocSinhId(Integer hocSinhId);
}
