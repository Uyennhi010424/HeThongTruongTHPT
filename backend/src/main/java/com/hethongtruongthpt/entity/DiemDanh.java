package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "diem_danh", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"ngay", "lop_hoc_id", "hoc_sinh_id", "tiet_hoc"})
})
public class DiemDanh {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "ngay", nullable = false)
    private LocalDate ngay;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "lop_hoc_id", nullable = false)
    private LopHoc lopHoc;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "hoc_sinh_id", nullable = false)
    private HocSinh hocSinh;

    @Column(name = "tiet_hoc")
    private Integer tietHoc;

    @Column(name = "mon_hoc_id")
    private Integer monHocId;

    @Column(name = "loai_vang", length = 20)
    private String loaiVang = "CO_MAT";

    @Column(name = "co_phep")
    private Boolean coPhep = false;

    @Column(name = "khong_phep")
    private Boolean khongPhep = false;

    @Column(name = "so_ngay_vang")
    private Integer soNgayVang = 0;

    @Column(name = "ghi_chu")
    private String ghiChu;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "giao_vien_id", nullable = false)
    private GiaoVien giaoVien;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        syncLoaiVang();
    }

    @PreUpdate
    public void preUpdate() {
        syncLoaiVang();
    }

    private void syncLoaiVang() {
        if ("CO_PHEP".equals(loaiVang)) {
            this.coPhep = true;
            this.khongPhep = false;
        } else if ("KHONG_PHEP".equals(loaiVang)) {
            this.coPhep = false;
            this.khongPhep = true;
        } else {
            this.coPhep = false;
            this.khongPhep = false;
        }
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public LocalDate getNgay() { return ngay; }
    public void setNgay(LocalDate ngay) { this.ngay = ngay; }

    public LopHoc getLopHoc() { return lopHoc; }
    public void setLopHoc(LopHoc lopHoc) { this.lopHoc = lopHoc; }

    public HocSinh getHocSinh() { return hocSinh; }
    public void setHocSinh(HocSinh hocSinh) { this.hocSinh = hocSinh; }

    public Integer getTietHoc() { return tietHoc; }
    public void setTietHoc(Integer tietHoc) { this.tietHoc = tietHoc; }

    public Integer getMonHocId() { return monHocId; }
    public void setMonHocId(Integer monHocId) { this.monHocId = monHocId; }

    public String getLoaiVang() { return loaiVang; }
    public void setLoaiVang(String loaiVang) { this.loaiVang = loaiVang; }

    public Boolean getCoPhep() { return coPhep; }
    public void setCoPhep(Boolean coPhep) { this.coPhep = coPhep; }

    public Boolean getKhongPhep() { return khongPhep; }
    public void setKhongPhep(Boolean khongPhep) { this.khongPhep = khongPhep; }

    public Integer getSoNgayVang() { return soNgayVang; }
    public void setSoNgayVang(Integer soNgayVang) { this.soNgayVang = soNgayVang; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }

    public GiaoVien getGiaoVien() { return giaoVien; }
    public void setGiaoVien(GiaoVien giaoVien) { this.giaoVien = giaoVien; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
