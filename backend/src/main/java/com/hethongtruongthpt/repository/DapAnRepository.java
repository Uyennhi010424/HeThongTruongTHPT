package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.DapAn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DapAnRepository extends JpaRepository<DapAn, Integer> {
    List<DapAn> findByCauHoiId(Integer cauHoiId);
}
