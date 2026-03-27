package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.DangTao;
import com.hethongtruongthpt.entity.DangTaoId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DangTaoRepository extends JpaRepository<DangTao, DangTaoId> {
}