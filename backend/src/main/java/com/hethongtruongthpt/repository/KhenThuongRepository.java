package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.KhenThuong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KhenThuongRepository extends JpaRepository<KhenThuong, Integer> {
    List<KhenThuong> findByHocSinhId(Integer hocSinhId);
}
