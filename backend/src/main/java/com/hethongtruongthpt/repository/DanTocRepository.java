package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.DanToc;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DanTocRepository extends JpaRepository<DanToc, Integer> {
    Optional<DanToc> findByTenDanToc(String tenDanToc);
}