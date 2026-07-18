package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.LichThi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LichThiRepository extends JpaRepository<LichThi, Integer> {
    List<LichThi> findByLopIdAndHocKyAndNamHoc(Integer lopId, Integer hocKy, String namHoc);
    List<LichThi> findByLopId(Integer lopId);
    List<LichThi> findByNgayThiBetween(LocalDate startDate, LocalDate endDate);
    List<LichThi> findByLoaiKiemTra(String loaiKiemTra);

    // Kiểm tra trùng lịch thi: cùng lớp, cùng môn, cùng loại kiểm tra, cùng học kỳ
    Optional<LichThi> findByLopIdAndMonHocIdAndLoaiKiemTraAndHocKyAndNamHoc(
            Integer lopId, Integer monHocId, String loaiKiemTra, Integer hocKy, String namHoc);

    // Kiểm tra trùng phòng thi: cùng ngày, cùng giờ, cùng phòng
    @Query("SELECT lt FROM LichThi lt WHERE lt.ngayThi = :ngayThi AND lt.phongThi = :phongThi " +
           "AND lt.gioBatDau < :gioKetThuc AND (lt.gioBatDau) > :gioBatDauMinusDuration")
    List<LichThi> findConflictingRoom(@Param("ngayThi") LocalDate ngayThi,
                                       @Param("phongThi") String phongThi,
                                       @Param("gioBatDau") LocalTime gioBatDau,
                                       @Param("gioKetThuc") LocalTime gioKetThuc,
                                       @Param("gioBatDauMinusDuration") LocalTime gioBatDauMinusDuration);

    // Tìm tất cả lịch thi trong năm học
    List<LichThi> findByNamHocAndHocKy(String namHoc, Integer hocKy);
}