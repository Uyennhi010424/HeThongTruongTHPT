package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "diem_audit_log")
public class DiemAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "diem_id", nullable = false)
    private Diem diem;

    @ManyToOne
    @JoinColumn(name = "hoc_sinh_id", nullable = false)
    private HocSinh hocSinh;

    @ManyToOne
    @JoinColumn(name = "mon_hoc_id", nullable = false)
    private MonHoc monHoc;

    @Column(name = "gia_tri_cu", precision = 4, scale = 1)
    private BigDecimal giaTriCu;

    @Column(name = "gia_tri_moi", precision = 4, scale = 1)
    private BigDecimal giaTriMoi;

    @Column(name = "hanh_dong", nullable = false)
    private String hanhDong; // INSERT, UPDATE, DELETE

    @ManyToOne
    @JoinColumn(name = "giao_vien_id", nullable = false)
    private GiaoVien giaoVien;

    @Column(name = "thoi_gian", nullable = false, updatable = false)
    private LocalDateTime thoiGian;

    @Column(name = "ly_do", columnDefinition = "TEXT")
    private String lyDo;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @PrePersist
    public void prePersist() {
        this.thoiGian = LocalDateTime.now();
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Diem getDiem() {
        return diem;
    }

    public void setDiem(Diem diem) {
        this.diem = diem;
    }

    public HocSinh getHocSinh() {
        return hocSinh;
    }

    public void setHocSinh(HocSinh hocSinh) {
        this.hocSinh = hocSinh;
    }

    public MonHoc getMonHoc() {
        return monHoc;
    }

    public void setMonHoc(MonHoc monHoc) {
        this.monHoc = monHoc;
    }

    public BigDecimal getGiaTriCu() {
        return giaTriCu;
    }

    public void setGiaTriCu(BigDecimal giaTriCu) {
        this.giaTriCu = giaTriCu;
    }

    public BigDecimal getGiaTriMoi() {
        return giaTriMoi;
    }

    public void setGiaTriMoi(BigDecimal giaTriMoi) {
        this.giaTriMoi = giaTriMoi;
    }

    public String getHanhDong() {
        return hanhDong;
    }

    public void setHanhDong(String hanhDong) {
        this.hanhDong = hanhDong;
    }

    public GiaoVien getGiaoVien() {
        return giaoVien;
    }

    public void setGiaoVien(GiaoVien giaoVien) {
        this.giaoVien = giaoVien;
    }

    public LocalDateTime getThoiGian() {
        return thoiGian;
    }

    public void setThoiGian(LocalDateTime thoiGian) {
        this.thoiGian = thoiGian;
    }

    public String getLyDo() {
        return lyDo;
    }

    public void setLyDo(String lyDo) {
        this.lyDo = lyDo;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
}
