package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.RoleConfig;
import com.hethongtruongthpt.enums.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleConfigRepository extends JpaRepository<RoleConfig, Integer> {
    Optional<RoleConfig> findByRole(RoleEnum role);
}
