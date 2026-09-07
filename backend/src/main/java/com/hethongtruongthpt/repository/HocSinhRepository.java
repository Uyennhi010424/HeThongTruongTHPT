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
    Optional<HocSinh> findByUserUsername(String username);
    @Query("SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l LEFT JOIN FETCH l.gvcn g WHERE h.user.id = :userId")
    Optional<HocSinh> findByUserId(@Param("userId") Integer userId);
    Optional<HocSinh> findByEmailIgnoreCase(String email);
    @Query("SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l LEFT JOIN FETCH l.gvcn g WHERE l.id = :lopId")
    List<HocSinh> findByLopId(@Param("lopId") Integer lopId);

    @Query("SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l LEFT JOIN FETCH l.gvcn g WHERE l.id = :lopId AND h.trangThai = :trangThai")
    List<HocSinh> findByLopIdAndTrangThai(@Param("lopId") Integer lopId, @Param("trangThai") Integer trangThai);
    @Query("SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l WHERE h.namNhapHoc = :namNhapHoc")
    List<HocSinh> findByNamNhapHoc(@Param("namNhapHoc") Integer namNhapHoc);

    @Query("SELECT h FROM HocSinh h WHERE LOWER(TRIM(h.hoTen)) = LOWER(TRIM(:hoTen)) AND h.ngaySinh = :ngaySinh AND h.lop.id = :lopId AND (h.trangThai IS NULL OR h.trangThai = 1)")
    List<HocSinh> findActiveDuplicateInClass(@Param("hoTen") String hoTen, @Param("ngaySinh") java.time.LocalDate ngaySinh, @Param("lopId") Integer lopId);

    @Query("SELECT h FROM HocSinh h WHERE h.maBhyt = :maBhyt AND (h.trangThai IS NULL OR h.trangThai = 1)")
    List<HocSinh> findByMaBhytActive(@Param("maBhyt") String maBhyt);

    @Query("SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l LEFT JOIN FETCH l.gvcn g")
    List<HocSinh> findAllWithLop();
    
    @Query("SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l LEFT JOIN FETCH l.gvcn g WHERE h.id = :id")
    Optional<HocSinh> findByIdWithLop(@Param("id") Integer id);
    long countByLopId(Integer lopId);

    long countByTrangThai(Integer trangThai);

    long countByLopIdAndTrangThai(Integer lopId, Integer trangThai);

    @Query("SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l WHERE " +
           "LOWER(h.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.sdt) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(l.tenLop) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<HocSinh> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l WHERE l.id = :lopId AND " +
           "(LOWER(h.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.sdt) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<HocSinh> searchByKeywordAndLopId(@Param("keyword") String keyword,
                                           @Param("lopId") Integer lopId,
                                           Pageable pageable);

    @Query("SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l WHERE l.khoi = :khoi AND " +
           "(LOWER(h.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.sdt) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(l.tenLop) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<HocSinh> searchByKeywordAndKhoi(@Param("keyword") String keyword,
                                          @Param("khoi") Integer khoi,
                                          Pageable pageable);

    @Query("SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l WHERE h.sdt = :phone")
    Page<HocSinh> searchByPhone(@Param("phone") String phone, Pageable pageable);

    @Query("SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l WHERE h.sdt = :phone AND l.id = :lopId")
    Page<HocSinh> searchByPhoneAndLopId(@Param("phone") String phone,
                                         @Param("lopId") Integer lopId,
                                         Pageable pageable);

    @Query("SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l WHERE h.sdt = :phone AND l.khoi = :khoi")
    Page<HocSinh> searchByPhoneAndKhoi(@Param("phone") String phone,
                                        @Param("khoi") Integer khoi,
                                        Pageable pageable);

    Page<HocSinh> findByLopId(Integer lopId, Pageable pageable);

    @Query(value = "SELECT h FROM HocSinh h LEFT JOIN FETCH h.lop l",
           countQuery = "SELECT count(h) FROM HocSinh h")
    Page<HocSinh> findAllSortedByLopAndName(Pageable pageable);
}