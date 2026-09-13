package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.GiaoVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GiaoVienRepository extends JpaRepository<GiaoVien, Integer> {
    Optional<GiaoVien> findByMaGiaoVien(String maGiaoVien);
    Optional<GiaoVien> findByUserId(Integer userId);
    Optional<GiaoVien> findByUserUsername(String username);

    @Query(value = "SELECT MAX(CAST(SUBSTRING(ma_giao_vien, 3) AS UNSIGNED)) FROM giao_vien WHERE ma_giao_vien REGEXP '^GV[0-9]+$'", nativeQuery = true)
    Integer findMaxTeacherCodeNumber();

    @Query(value = "SELECT COUNT(*) FROM giao_vien WHERE ma_giao_vien = :maGiaoVien", nativeQuery = true)
    long countByMaGiaoVienNative(@Param("maGiaoVien") String maGiaoVien);

    @Query(value = "SELECT COUNT(*) FROM giao_vien WHERE email = :email", nativeQuery = true)
    long countByEmailNative(@Param("email") String email);

    @Query(value = "SELECT COUNT(*) FROM giao_vien WHERE email = :email AND id != :id", nativeQuery = true)
    long countByEmailAndIdNotNative(@Param("email") String email, @Param("id") Integer id);
}