package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.PhanQuyen;
import com.hethongtruongthpt.entity.PhanQuyenId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhanQuyenRepository extends JpaRepository<PhanQuyen, PhanQuyenId> {
	java.util.List<PhanQuyen> findByIdUserId(Long userId);

	void deleteByIdUserId(Long userId);
}