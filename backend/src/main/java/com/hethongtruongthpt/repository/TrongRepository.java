package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.Trong;
import com.hethongtruongthpt.entity.TrongId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrongRepository extends JpaRepository<Trong, TrongId> {
}