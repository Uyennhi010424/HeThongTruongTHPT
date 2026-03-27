package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.GhiNhanTrong;
import com.hethongtruongthpt.entity.GhiNhanTrongId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GhiNhanTrongRepository extends JpaRepository<GhiNhanTrong, GhiNhanTrongId> {
}