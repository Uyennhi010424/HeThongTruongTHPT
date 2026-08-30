package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.DiemGuiLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Set;

@Repository
public interface DiemGuiLogRepository extends JpaRepository<DiemGuiLog, Long> {

    /**
     * Kiểm tra một điểm đã được gửi trong kỳ này chưa.
     * Dùng để chống gửi trùng (idempotency check).
     */
    boolean existsByDiem_IdAndKyGui(Integer diemId, String kyGui);

    /**
     * Lấy tập hợp tất cả diem_id đã được gửi trong kỳ này.
     * Dùng để lọc một lần thay vì check từng bản ghi riêng lẻ.
     */
    @Query("SELECT d.diem.id FROM DiemGuiLog d WHERE d.kyGui = :kyGui")
    Set<Integer> findSentDiemIdsByKyGui(@Param("kyGui") String kyGui);
}
