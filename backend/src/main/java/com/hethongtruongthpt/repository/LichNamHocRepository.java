package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.LichNamHoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LichNamHocRepository extends JpaRepository<LichNamHoc, Integer> {

    @Query("SELECT COUNT(l) FROM LichNamHoc l WHERE l.ngay BETWEEN :from AND :to AND l.ngayHoc = true")
    long countNgayHocBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    List<LichNamHoc> findByNgayHocFalse();

}
