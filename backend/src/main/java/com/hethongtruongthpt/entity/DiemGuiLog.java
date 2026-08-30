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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diem_id", nullable = false)
    private Diem diem;

    /** ID học sinh */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoc_sinh_id", nullable = false)
    private HocSinh hocSinh;

    /** ID phụ huynh đã nhận tin nhắn */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phu_huynh_id", nullable = false)
    private PhuHuynh phuHuynh;

    /** ID ThongBao được tạo ra cho lần gửi này (nullable vì có thể ghi log trước khi lưu ThongBao) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thong_bao_id")
    private ThongBao thongBao;

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

    public Integer getDiemId() { return diem != null ? diem.getId() : null; }
    public void setDiemId(Integer diemId) { 
        if (diemId == null) { this.diem = null; return; }
        Diem d = new Diem(); d.setId(diemId); this.diem = d; 
    }

    public Integer getHocSinhId() { return hocSinh != null ? hocSinh.getId() : null; }
    public void setHocSinhId(Integer hocSinhId) { 
        if (hocSinhId == null) { this.hocSinh = null; return; }
        HocSinh h = new HocSinh(); h.setId(hocSinhId); this.hocSinh = h; 
    }

    public Integer getPhuHuynhId() { return phuHuynh != null ? phuHuynh.getId() : null; }
    public void setPhuHuynhId(Integer phuHuynhId) { 
        if (phuHuynhId == null) { this.phuHuynh = null; return; }
        PhuHuynh p = new PhuHuynh(); p.setId(phuHuynhId); this.phuHuynh = p; 
    }

    public Integer getThongBaoId() { return thongBao != null ? thongBao.getId() : null; }
    public void setThongBaoId(Integer thongBaoId) { 
        if (thongBaoId == null) { this.thongBao = null; return; }
        ThongBao t = new ThongBao(); t.setId(thongBaoId); this.thongBao = t; 
    }

    public LocalDateTime getNgayGui() { return ngayGui; }
    public void setNgayGui(LocalDateTime ngayGui) { this.ngayGui = ngayGui; }

    public String getKyGui() { return kyGui; }
    public void setKyGui(String kyGui) { this.kyGui = kyGui; }
}
