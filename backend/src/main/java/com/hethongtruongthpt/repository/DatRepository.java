package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.Dat;
import com.hethongtruongthpt.entity.DatId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DatRepository extends JpaRepository<Dat, DatId> {
}