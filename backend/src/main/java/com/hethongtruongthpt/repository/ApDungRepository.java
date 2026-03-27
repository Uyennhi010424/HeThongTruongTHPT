package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.ApDung;
import com.hethongtruongthpt.entity.ApDungId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApDungRepository extends JpaRepository<ApDung, ApDungId> {
}