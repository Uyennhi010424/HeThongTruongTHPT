package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.Co;
import com.hethongtruongthpt.entity.CoId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoRepository extends JpaRepository<Co, CoId> {
}