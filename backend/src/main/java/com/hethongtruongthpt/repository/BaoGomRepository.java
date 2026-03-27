package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.BaoGom;
import com.hethongtruongthpt.entity.BaoGomId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BaoGomRepository extends JpaRepository<BaoGom, BaoGomId> {
}