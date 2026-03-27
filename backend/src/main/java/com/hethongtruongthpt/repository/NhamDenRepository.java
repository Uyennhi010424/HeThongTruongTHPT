package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.NhamDen;
import com.hethongtruongthpt.entity.NhamDenId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NhamDenRepository extends JpaRepository<NhamDen, NhamDenId> {
}