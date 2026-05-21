package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.MonHoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonHocRepository extends JpaRepository<MonHoc, Integer> {
    Optional<MonHoc> findByMaMon(String maMon);
    Optional<MonHoc> findByTenMon(String tenMon);
    List<MonHoc> findByIsActiveTrue();
}