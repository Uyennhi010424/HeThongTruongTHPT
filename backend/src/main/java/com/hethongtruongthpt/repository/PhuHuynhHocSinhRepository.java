package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.PhuHuynhHocSinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhuHuynhHocSinhRepository extends JpaRepository<PhuHuynhHocSinh, Integer> {
    List<PhuHuynhHocSinh> findByHocSinhId(Integer hocSinhId);
    List<PhuHuynhHocSinh> findByPhuHuynhId(Integer phuHuynhId);
    List<PhuHuynhHocSinh> findByHocSinhIdAndLaNguoiLienHeChinhTrue(Integer hocSinhId);
    List<PhuHuynhHocSinh> findByHocSinhIdIn(List<Integer> hocSinhIds);
}
