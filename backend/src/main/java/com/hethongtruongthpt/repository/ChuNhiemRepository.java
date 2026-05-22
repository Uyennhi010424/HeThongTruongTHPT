package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.ChuNhiem;
import com.hethongtruongthpt.entity.ChuNhiemId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChuNhiemRepository extends JpaRepository<ChuNhiem, ChuNhiemId> {
	List<ChuNhiem> findById_GiaoVienId(Integer giaoVienId);

	List<ChuNhiem> findById_LopId(Integer lopId);

	void deleteById_GiaoVienId(Integer giaoVienId);

	void deleteById_LopId(Integer lopId);
}