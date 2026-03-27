package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.ChuNhiem;
import com.hethongtruongthpt.entity.ChuNhiemId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChuNhiemRepository extends JpaRepository<ChuNhiem, ChuNhiemId> {
	List<ChuNhiem> findById_GiaoVienId(Long giaoVienId);

	List<ChuNhiem> findById_LopId(Long lopId);

	void deleteById_GiaoVienId(Long giaoVienId);

	void deleteById_LopId(Long lopId);
}