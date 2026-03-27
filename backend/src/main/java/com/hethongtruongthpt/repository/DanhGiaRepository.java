package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.DanhGia;
import com.hethongtruongthpt.entity.DanhGiaId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DanhGiaRepository extends JpaRepository<DanhGia, DanhGiaId> {
}