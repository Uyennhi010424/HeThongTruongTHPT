package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Ghi lại lịch sử mỗi lần hệ thống gửi điểm tự động cho phụ huynh.
 * Thiết kế tách biệt với bảng diem để không ảnh hưởng dữ liệu gốc
 * và dễ mở rộng (retry, nhiều loại thông báo, v.v.).
 */
@Entity
@Table(
    name = "diem_gui_log",
    indexes = {
        @Index(name = "idx_dgl_diem", columnList = "diem_id"),
        @Index(name = "idx_dgl_hs_ky", columnList = "hoc_sinh_id, ky_gui")
    }
)
public class DiemGuiLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /** ID bản ghi điểm đã gửi */
    @Column(name = "diem_id", nullable = false)
    private Integer diemId;

    /** ID học sinh */
    @Column(name = "hoc_sinh_id", nullable = false)
    private Integer hocSinhId;

    /** ID phụ huynh đã nhận tin nhắn */
    @Column(name = "phu_huynh_id", nullable = false)
    private Integer phuHuynhId;

    /** ID ThongBao được tạo ra cho lần gửi này (nullable vì có thể ghi log trước khi lưu ThongBao) */
    @Column(name = "thong_bao_id")
    private Integer thongBaoId;

    /** Thời điểm gửi thực tế */
    @Column(name = "ngay_gui", nullable = false)
    private LocalDateTime ngayGui;

    /**
     * Kỳ gửi dạng "YYYY-MM" (ví dụ: "2026-08").
     * Dùng để kiểm tra nhanh điểm nào đã gửi trong tháng nào,
     * tránh JOIN phức tạp.
     */
    @Column(name = "ky_gui", length = 7, nullable = false)
    private String kyGui;

    @PrePersist
    public void prePersist() {
        if (this.ngayGui == null) {
            this.ngayGui = LocalDateTime.now();
        }
    }

    // ─── Getters & Setters ───────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getDiemId() { return diemId; }
    public void setDiemId(Integer diemId) { this.diemId = diemId; }

    public Integer getHocSinhId() { return hocSinhId; }
    public void setHocSinhId(Integer hocSinhId) { this.hocSinhId = hocSinhId; }

    public Integer getPhuHuynhId() { return phuHuynhId; }
    public void setPhuHuynhId(Integer phuHuynhId) { this.phuHuynhId = phuHuynhId; }

    public Integer getThongBaoId() { return thongBaoId; }
    public void setThongBaoId(Integer thongBaoId) { this.thongBaoId = thongBaoId; }

    public LocalDateTime getNgayGui() { return ngayGui; }
    public void setNgayGui(LocalDateTime ngayGui) { this.ngayGui = ngayGui; }

    public String getKyGui() { return kyGui; }
    public void setKyGui(String kyGui) { this.kyGui = kyGui; }
}
