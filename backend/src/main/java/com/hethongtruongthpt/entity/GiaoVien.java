package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "GIAO_VIEN")
public class GiaoVien {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_GIAOVIEN")
    private Long id;

    @Column(name = "HO_TEN", length = 100)
    private String hoTen;

    @Column(name = "NGAY_SINH")
    private java.time.LocalDate ngaySinh;

    @Column(name = "GIOI_TINH")
    private Boolean gioiTinh;

    @Column(name = "BO_MON", length = 100)
    private String boMon;

    @Column(name = "TRINH_DO", length = 100)
    private String trinhDo;

    @Column(name = "SO_DIEN_THOAI", length = 15)
    private String sdt;

    @Column(name = "EMAIL", length = 100)
    private String email;

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

    public java.time.LocalDate getNgaySinh() {
        return ngaySinh;
    }

    public void setNgaySinh(java.time.LocalDate ngaySinh) {
        this.ngaySinh = ngaySinh;
    }

    public Boolean getGioiTinh() {
        return gioiTinh;
    }

    public void setGioiTinh(Boolean gioiTinh) {
        this.gioiTinh = gioiTinh;
    }

    public String getBoMon() {
        return boMon;
    }

    public void setBoMon(String boMon) {
        this.boMon = boMon;
    }

    public String getTrinhDo() {
        return trinhDo;
    }

    public void setTrinhDo(String trinhDo) {
        this.trinhDo = trinhDo;
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
}