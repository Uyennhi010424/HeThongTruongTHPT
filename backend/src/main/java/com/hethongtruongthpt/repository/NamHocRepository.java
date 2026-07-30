package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.NamHoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NamHocRepository extends JpaRepository<NamHoc, Integer> {
	Optional<NamHoc> findByTenNamHoc(String tenNamHoc);
	
	java.util.List<NamHoc> findByTrangThai(String trangThai);
	
	@Query("select coalesce(max(n.id), 0) from NamHoc n")
	Integer findMaxId();
}