package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.ChiTietBaiLam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietBaiLamRepository extends JpaRepository<ChiTietBaiLam, Integer> {
    List<ChiTietBaiLam> findByBaiLamId(Integer baiLamId);
}
