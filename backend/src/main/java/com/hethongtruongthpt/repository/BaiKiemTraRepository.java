package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.BaiKiemTra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface BaiKiemTraRepository extends JpaRepository<BaiKiemTra, Integer> {
    List<BaiKiemTra> findByGiaoVienIdOrderByNgayTaoDesc(Integer giaoVienId);
    List<BaiKiemTra> findByLopHocIdOrderByNgayTaoDesc(Integer lopHocId);
    
    // Tìm các bài kiểm tra sắp diễn ra trong X phút tới và chưa thông báo
    List<BaiKiemTra> findByThoiGianBatDauBetweenAndDaThongBaoFalse(LocalDateTime start, LocalDateTime end);
}
