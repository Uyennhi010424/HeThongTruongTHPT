package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.SoHuuTaiKhoan;
import com.hethongtruongthpt.entity.SoHuuTaiKhoanId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SoHuuTaiKhoanRepository extends JpaRepository<SoHuuTaiKhoan, SoHuuTaiKhoanId> {
}