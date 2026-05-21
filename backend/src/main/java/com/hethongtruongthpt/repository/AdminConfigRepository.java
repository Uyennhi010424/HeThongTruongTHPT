package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.AdminConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminConfigRepository extends JpaRepository<AdminConfig, Integer> {
    Optional<AdminConfig> findByConfigKey(String configKey);
}
