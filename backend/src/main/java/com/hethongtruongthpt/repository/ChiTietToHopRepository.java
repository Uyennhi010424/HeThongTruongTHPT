package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.ChiTietToHop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietToHopRepository extends JpaRepository<ChiTietToHop, Integer> {
    List<ChiTietToHop> findByToHopMonId(Integer toHopMonId);
    void deleteByToHopMonId(Integer toHopMonId);
    long countByToHopMonId(Integer toHopMonId);
}
