package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.PhuHuynh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PhuHuynhRepository extends JpaRepository<PhuHuynh, Integer> {
    Optional<PhuHuynh> findByUserId(Integer userId);
}