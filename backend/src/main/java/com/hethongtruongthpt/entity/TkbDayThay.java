package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tkb_day_thay")
public class TkbDayThay {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "tkb_id", nullable = false)
    private ThoiKhoaBieu thoiKhoaBieu;

    @ManyToOne
    @JoinColumn(name = "giao_vien_thay_id", nullable = false)
    private GiaoVien giaoVienThay;

    @Column(name = "ngay", nullable = false)
    private LocalDate ngay;

    @Column(name = "ghi_chu", length = 255)
    private String ghiChu;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public ThoiKhoaBieu getThoiKhoaBieu() { return thoiKhoaBieu; }
    public void setThoiKhoaBieu(ThoiKhoaBieu thoiKhoaBieu) { this.thoiKhoaBieu = thoiKhoaBieu; }

    public GiaoVien getGiaoVienThay() { return giaoVienThay; }
    public void setGiaoVienThay(GiaoVien giaoVienThay) { this.giaoVienThay = giaoVienThay; }

    public LocalDate getNgay() { return ngay; }
    public void setNgay(LocalDate ngay) { this.ngay = ngay; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
