package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.HocSinh;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HocSinhRepository extends JpaRepository<HocSinh, Integer> {
    Optional<HocSinh> findByMaHocSinh(String maHocSinh);
    Optional<HocSinh> findByUserId(Integer userId);
    Optional<HocSinh> findByEmailIgnoreCase(String email);
    List<HocSinh> findByLopId(Integer lopId);
    List<HocSinh> findByNamNhapHoc(Integer namNhapHoc);

    long countByLopId(Integer lopId);

    long countByTrangThai(Integer trangThai);

    long countByLopIdAndTrangThai(Integer lopId, Integer trangThai);

    @Query("SELECT h FROM HocSinh h WHERE " +
           "LOWER(h.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.sdt) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.lop.tenLop) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<HocSinh> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT h FROM HocSinh h WHERE h.lop.id = :lopId AND " +
           "(LOWER(h.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.sdt) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<HocSinh> searchByKeywordAndLopId(@Param("keyword") String keyword,
                                           @Param("lopId") Integer lopId,
                                           Pageable pageable);

    @Query("SELECT h FROM HocSinh h WHERE h.lop.khoi = :khoi AND " +
           "(LOWER(h.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.sdt) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.lop.tenLop) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<HocSinh> searchByKeywordAndKhoi(@Param("keyword") String keyword,
                                          @Param("khoi") Integer khoi,
                                          Pageable pageable);

    // Tìm kiếm theo SĐT chính xác (10 số)
    @Query("SELECT h FROM HocSinh h WHERE h.sdt = :phone")
    Page<HocSinh> searchByPhone(@Param("phone") String phone, Pageable pageable);

    @Query("SELECT h FROM HocSinh h WHERE h.sdt = :phone AND h.lop.id = :lopId")
    Page<HocSinh> searchByPhoneAndLopId(@Param("phone") String phone,
                                         @Param("lopId") Integer lopId,
                                         Pageable pageable);

    @Query("SELECT h FROM HocSinh h WHERE h.sdt = :phone AND h.lop.khoi = :khoi")
    Page<HocSinh> searchByPhoneAndKhoi(@Param("phone") String phone,
                                        @Param("khoi") Integer khoi,
                                        Pageable pageable);

    Page<HocSinh> findByLopId(Integer lopId, Pageable pageable);

    @Query("SELECT h FROM HocSinh h LEFT JOIN h.lop l ORDER BY l.khoi ASC, l.tenLop ASC, h.hoTen ASC")
    Page<HocSinh> findAllSortedByLopAndName(Pageable pageable);
}