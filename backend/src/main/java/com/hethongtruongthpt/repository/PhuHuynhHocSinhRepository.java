package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.PhuHuynhHocSinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface PhuHuynhHocSinhRepository extends JpaRepository<PhuHuynhHocSinh, Integer> {
    @Query("SELECT phs FROM PhuHuynhHocSinh phs " +
           "JOIN FETCH phs.phuHuynh ph " +
           "LEFT JOIN FETCH ph.user u " +
           "WHERE phs.hocSinh.id = :hocSinhId")
    List<PhuHuynhHocSinh> findByHocSinhId(@Param("hocSinhId") Integer hocSinhId);
    
    @Query("SELECT phs FROM PhuHuynhHocSinh phs " +
           "JOIN FETCH phs.hocSinh hs " +
           "LEFT JOIN FETCH hs.lop l " +
           "LEFT JOIN FETCH l.gvcn " +
           "WHERE phs.phuHuynh.id = :phuHuynhId")
    List<PhuHuynhHocSinh> findByPhuHuynhId(@Param("phuHuynhId") Integer phuHuynhId);

    @Query("SELECT phs FROM PhuHuynhHocSinh phs " +
           "JOIN FETCH phs.phuHuynh ph " +
           "LEFT JOIN FETCH ph.user u " +
           "WHERE phs.hocSinh.id = :hocSinhId AND phs.laNguoiLienHeChinh = true")
    List<PhuHuynhHocSinh> findByHocSinhIdAndLaNguoiLienHeChinhTrue(@Param("hocSinhId") Integer hocSinhId);

    @Query("SELECT phs FROM PhuHuynhHocSinh phs " +
           "JOIN FETCH phs.phuHuynh ph " +
           "LEFT JOIN FETCH ph.user u " +
           "JOIN FETCH phs.hocSinh hs " +
           "WHERE hs.id IN :hocSinhIds")
    List<PhuHuynhHocSinh> findByHocSinhIdIn(@Param("hocSinhIds") List<Integer> hocSinhIds);
}
