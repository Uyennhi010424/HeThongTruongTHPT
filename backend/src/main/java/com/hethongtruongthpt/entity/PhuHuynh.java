package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "PHU_HUYNH")
public class PhuHuynh {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_PHUHUYNH")
    private Long id;

    @Column(name = "HO_TEN", length = 100)
    private String hoTen;

    @Column(name = "SO_DIEN_THOAI", length = 15)
    private String soDienThoai;

    @Column(name = "EMAIL", length = 100)
    private String email;

    @Column(name = "DIA_CHI", length = 255)
    private String diaChi;

    @Column(name = "NGHE_NGHIEP", length = 100)
    private String ngheNghiep;

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

    public String getSoDienThoai() {
        return soDienThoai;
    }

    public void setSoDienThoai(String soDienThoai) {
        this.soDienThoai = soDienThoai;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDiaChi() {
        return diaChi;
    }

    public void setDiaChi(String diaChi) {
        this.diaChi = diaChi;
    }

    public String getNgheNghiep() {
        return ngheNghiep;
    }

    public void setNgheNghiep(String ngheNghiep) {
        this.ngheNghiep = ngheNghiep;
    }
}