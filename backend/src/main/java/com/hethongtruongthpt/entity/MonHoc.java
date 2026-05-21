package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "mon_hoc")
public class MonHoc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "ten_mon", length = 100, nullable = false, unique = true)
    private String tenMon;

    @Column(name = "ma_mon", length = 20, nullable = false, unique = true)
    private String maMon;

    @Column(name = "nhom_danh_gia", nullable = false)
    private String nhomDanhGia; // DIEM_SO or NHAN_XET

    @Column(name = "so_dtx_hoc_ky", nullable = false)
    private Integer soDtxHocKy; // Số điểm thường xuyên trong học kỳ

    @Column(name = "khoi_ap_dung", length = 20, nullable = false)
    private String khoiApDung;

    @Column(name = "mo_ta")
    private String moTa;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTenMon() {
        return tenMon;
    }

    public void setTenMon(String tenMon) {
        this.tenMon = tenMon;
    }

    public String getMaMon() {
        return maMon;
    }

    public void setMaMon(String maMon) {
        this.maMon = maMon;
    }

    public String getNhomDanhGia() {
        return nhomDanhGia;
    }

    public void setNhomDanhGia(String nhomDanhGia) {
        this.nhomDanhGia = nhomDanhGia;
    }

    public Integer getSoDtxHocKy() {
        return soDtxHocKy;
    }

    public void setSoDtxHocKy(Integer soDtxHocKy) {
        this.soDtxHocKy = soDtxHocKy;
    }

    public String getKhoiApDung() {
        return khoiApDung;
    }

    public void setKhoiApDung(String khoiApDung) {
        this.khoiApDung = khoiApDung;
    }

    public String getMoTa() {
        return moTa;
    }

    public void setMoTa(String moTa) {
        this.moTa = moTa;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}