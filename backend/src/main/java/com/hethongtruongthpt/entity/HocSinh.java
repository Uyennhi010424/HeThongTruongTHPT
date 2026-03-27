package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "HOC_SINH")
public class HocSinh {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_HOCSINH")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ID_LOP")
    private LopHoc lopHoc;

    @Column(name = "ID_HOCBA")
    private Long hocBaId;

    @Column(name = "ID_DANTOC")
    private Long danTocId;

    @Column(name = "DAN_TOC", length = 100)
    private String danToc;

    @Column(name = "ID_PHUHUYNH")
    private Long phuHuynhId;

    @Column(name = "TON_GIAO", length = 100)
    private String tonGiao;

    @Column(name = "HO_TEN", length = 100)
    private String hoTen;

    @Column(name = "NGAY_SINH")
    private LocalDate ngaySinh;

    @Column(name = "GIOI_TINH")
    private Boolean gioiTinh;

    @Column(name = "DIA_CHI", length = 255)
    private String diaChi;

    @Column(name = "SO_DIEN_THOAI", length = 15)
    private String sdt;

    @Column(name = "EMAIL", length = 100)
    private String email;

    @Column(name = "NAM_NHAP_HOC")
    private Integer namNhapHoc;

    @Column(name = "MA_BHYT", length = 20)
    private String maBhyt;

    @Column(name = "DIEN_CHINH_SACH")
    private Boolean dienChinhSach;

    @Column(name = "TRANG_THAI")
    private Integer trangThai;

    @Column(name = "CREATED_AT")
    private java.time.LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private java.time.LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getHoTen() {
        return hoTen;
    }

    public void setHoTen(String hoTen) {
        this.hoTen = hoTen;
    }

    public LocalDate getNgaySinh() {
        return ngaySinh;
    }

    public void setNgaySinh(LocalDate ngaySinh) {
        this.ngaySinh = ngaySinh;
    }

    public Boolean getGioiTinh() {
        return gioiTinh;
    }

    public void setGioiTinh(Boolean gioiTinh) {
        this.gioiTinh = gioiTinh;
    }

    public String getDiaChi() {
        return diaChi;
    }

    public void setDiaChi(String diaChi) {
        this.diaChi = diaChi;
    }

    public String getSdt() {
        return sdt;
    }

    public void setSdt(String sdt) {
        this.sdt = sdt;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LopHoc getLopHoc() {
        return lopHoc;
    }

    public void setLopHoc(LopHoc lopHoc) {
        this.lopHoc = lopHoc;
    }

    public Long getHocBaId() {
        return hocBaId;
    }

    public void setHocBaId(Long hocBaId) {
        this.hocBaId = hocBaId;
    }

    public Long getDanTocId() {
        return danTocId;
    }

    public void setDanTocId(Long danTocId) {
        this.danTocId = danTocId;
    }

    public String getDanToc() {
        return danToc;
    }

    public void setDanToc(String danToc) {
        this.danToc = danToc;
    }

    public Long getPhuHuynhId() {
        return phuHuynhId;
    }

    public void setPhuHuynhId(Long phuHuynhId) {
        this.phuHuynhId = phuHuynhId;
    }

    public String getTonGiao() {
        return tonGiao;
    }

    public void setTonGiao(String tonGiao) {
        this.tonGiao = tonGiao;
    }

    public Integer getNamNhapHoc() {
        return namNhapHoc;
    }

    public void setNamNhapHoc(Integer namNhapHoc) {
        this.namNhapHoc = namNhapHoc;
    }

    public String getMaBhyt() {
        return maBhyt;
    }

    public void setMaBhyt(String maBhyt) {
        this.maBhyt = maBhyt;
    }

    public Boolean getDienChinhSach() {
        return dienChinhSach;
    }

    public void setDienChinhSach(Boolean dienChinhSach) {
        this.dienChinhSach = dienChinhSach;
    }

    public Integer getTrangThai() {
        return trangThai;
    }

    public void setTrangThai(Integer trangThai) {
        this.trangThai = trangThai;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public java.time.LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(java.time.LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}