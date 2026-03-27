package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.NamHoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NamHocRepository extends JpaRepository<NamHoc, Long> {
	@Query("select coalesce(max(n.id), 0) from NamHoc n")
	Long findMaxId();
}