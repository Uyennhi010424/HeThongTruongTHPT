package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.HanhKiem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HanhKiemRepository extends JpaRepository<HanhKiem, Integer> {

    List<HanhKiem> findByHocSinhId(Integer hocSinhId);

    List<HanhKiem> findByHocSinhIdIn(List<Integer> hocSinhIds);

    List<HanhKiem> findByHocSinhIdInAndNamHocId(List<Integer> hocSinhIds, Integer namHocId);

    List<HanhKiem> findByGiaoVienId(Integer giaoVienId);

    List<HanhKiem> findByHocSinhIdAndNamHocId(Integer hocSinhId, Integer namHocId);

    List<HanhKiem> findByHocSinhLopIdAndNamHocId(Integer lopId, Integer namHocId);

    List<HanhKiem> findByHocSinhLopId(Integer lopId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"hocSinh", "hocSinh.lop", "namHoc"})
    List<HanhKiem> findByNamHocId(Integer namHocId);

    Optional<HanhKiem> findByHocSinhIdAndNamHocIdAndHocKy(Integer hocSinhId, Integer namHocId, Integer hocKy);

    boolean existsByNamHocId(Integer namHocId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM HanhKiem h WHERE h.namHoc.id = :namHocId")
    void deleteByNamHocId(@org.springframework.data.repository.query.Param("namHocId") Integer namHocId);
}
