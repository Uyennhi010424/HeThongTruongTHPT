package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "LICH_THI")
public class LichThi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_LICHTHI")
    private Long id;

    @Column(name = "NGAY_THI")
    private LocalDate ngayThi;

    @Column(name = "GIO_BAT_DAU")
    private LocalTime gioBatDau;

    @Column(name = "THOI_GIAN_THI")
    private Integer thoiGianThi;

    @Column(name = "PHONG_THI", length = 50)
    private String phongThi;

    @Column(name = "GHI_CHU", length = 255)
    private String ghiChu;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getNgayThi() {
        return ngayThi;
    }

    public void setNgayThi(LocalDate ngayThi) {
        this.ngayThi = ngayThi;
    }

    public LocalTime getGioBatDau() {
        return gioBatDau;
    }

    public void setGioBatDau(LocalTime gioBatDau) {
        this.gioBatDau = gioBatDau;
    }

    public Integer getThoiGianThi() {
        return thoiGianThi;
    }

    public void setThoiGianThi(Integer thoiGianThi) {
        this.thoiGianThi = thoiGianThi;
    }

    public String getPhongThi() {
        return phongThi;
    }

    public void setPhongThi(String phongThi) {
        this.phongThi = phongThi;
    }

    public String getGhiChu() {
        return ghiChu;
    }

    public void setGhiChu(String ghiChu) {
        this.ghiChu = ghiChu;
    }
}