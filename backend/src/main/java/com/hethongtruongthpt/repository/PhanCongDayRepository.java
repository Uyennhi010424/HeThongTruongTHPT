package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.PhanCongDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhanCongDayRepository extends JpaRepository<PhanCongDay, Integer> {
    List<PhanCongDay> findByNamHocAndHocKy(String namHoc, Integer hocKy);
    List<PhanCongDay> findByGiaoVienIdAndNamHocAndHocKy(Integer giaoVienId, String namHoc, Integer hocKy);
    List<PhanCongDay> findByLopId(Integer lopId);
    List<PhanCongDay> findByGiaoVienId(Integer giaoVienId);
    java.util.Optional<PhanCongDay> findByGiaoVienIdAndMonHocIdAndLopIdAndHocKy(Integer giaoVienId, Integer monHocId, Integer lopId, Integer hocKy);
}
