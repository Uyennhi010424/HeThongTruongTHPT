package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.HocKy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface HocKyRepository extends JpaRepository<HocKy, Integer> {
	@Query("select coalesce(max(h.id), 0) from HocKy h")
	Integer findMaxId();
}