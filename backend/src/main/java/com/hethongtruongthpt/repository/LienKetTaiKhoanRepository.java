package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.LienKetTaiKhoan;
import com.hethongtruongthpt.entity.LienKetTaiKhoanId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LienKetTaiKhoanRepository extends JpaRepository<LienKetTaiKhoan, LienKetTaiKhoanId> {
}