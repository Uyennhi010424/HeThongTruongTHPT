package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "giao_vien_nghi", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"giao_vien_id", "ngay"})
})
public class GiaoVienNghi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "giao_vien_id", nullable = false)
    private GiaoVien giaoVien;

    @Column(name = "ngay", nullable = false)
    private LocalDate ngay;

    @Column(name = "nam_hoc", length = 9, nullable = false)
    private String namHoc;

    @Column(name = "ly_do", length = 255)
    private String lyDo;

    @Column(name = "ghi_chu")
    private String ghiChu;

    @Column(name = "trang_thai", length = 20, nullable = false)
    private String trangThai = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "ly_do_tu_choi")
    private String lyDoTuChoi;

    @Column(name = "admin_message", columnDefinition = "TEXT")
    private String adminMessage;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "giao_vien_thay_id")
    private GiaoVien giaoVienThay;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public GiaoVien getGiaoVien() { return giaoVien; }
    public void setGiaoVien(GiaoVien giaoVien) { this.giaoVien = giaoVien; }

    public LocalDate getNgay() { return ngay; }
    public void setNgay(LocalDate ngay) { this.ngay = ngay; }

    public String getNamHoc() { return namHoc; }
    public void setNamHoc(String namHoc) { this.namHoc = namHoc; }

    public String getLyDo() { return lyDo; }
    public void setLyDo(String lyDo) { this.lyDo = lyDo; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }

    public String getTrangThai() { return trangThai; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }

    public String getLyDoTuChoi() { return lyDoTuChoi; }
    public void setLyDoTuChoi(String lyDoTuChoi) { this.lyDoTuChoi = lyDoTuChoi; }

    public GiaoVien getGiaoVienThay() { return giaoVienThay; }
    public void setGiaoVienThay(GiaoVien giaoVienThay) { this.giaoVienThay = giaoVienThay; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getAdminMessage() { return adminMessage; }
    public void setAdminMessage(String adminMessage) { this.adminMessage = adminMessage; }

    public User getApprovedBy() { return approvedBy; }
    public void setApprovedBy(User approvedBy) { this.approvedBy = approvedBy; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
}
