package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.GiaoVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GiaoVienRepository extends JpaRepository<GiaoVien, Integer> {
    Optional<GiaoVien> findByMaGiaoVien(String maGiaoVien);
    Optional<GiaoVien> findByUserId(Integer userId);
    Optional<GiaoVien> findByUserUsername(String username);
}