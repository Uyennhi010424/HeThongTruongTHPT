package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.GiaoVienBan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GiaoVienBanRepository extends JpaRepository<GiaoVienBan, Integer> {
    List<GiaoVienBan> findByGiaoVienId(Integer giaoVienId);
    List<GiaoVienBan> findByGiaoVienIdAndTuan(Integer giaoVienId, Integer tuan);
}
