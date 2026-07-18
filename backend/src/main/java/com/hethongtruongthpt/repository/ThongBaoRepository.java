package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.ThongBao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ThongBaoRepository extends JpaRepository<ThongBao, Integer> {
    List<ThongBao> findByLoai(String loai);
    List<ThongBao> findByLopId(Integer lopId);
    List<ThongBao> findByHocSinhId(Integer hocSinhId);
    List<ThongBao> findByHanHienThiGreaterThan(LocalDateTime now);

    // ─── Reply / Thread queries ───────────────────────────────────────
    /** Lấy tất cả replies của một thông báo gốc */
    List<ThongBao> findByParentIdOrderByNgayDangAsc(Integer parentId);

    /** Inbox: lấy thông báo gửi riêng cho userId cụ thể */
    List<ThongBao> findByRecipientIdOrderByNgayDangDesc(Integer recipientId);

    /** Lấy thông báo gốc (không phải reply) gửi bởi userId */
    List<ThongBao> findByNguoiTaoIdAndIsReplyFalseOrderByNgayDangDesc(Integer nguoiTaoId);

    /** Lấy tất cả replies gửi bởi userId */
    List<ThongBao> findByNguoiTaoIdAndIsReplyTrueOrderByNgayDangDesc(Integer nguoiTaoId);

    /** Lấy thread conversation: thông báo gốc + tất cả replies của nó */
    List<ThongBao> findByIdOrParentIdOrderByNgayDangAsc(Integer id, Integer parentId);
}