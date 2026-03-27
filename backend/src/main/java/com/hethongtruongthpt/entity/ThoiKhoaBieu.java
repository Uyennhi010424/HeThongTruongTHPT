package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "THOI_KHOA_BIEU")
public class ThoiKhoaBieu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_TKB")
    private Long id;

    @Column(name = "THU")
    private Integer thu;

    @Column(name = "TIET_BAT_DAU")
    private Integer tietBatDau;

    @Column(name = "SO_TIET")
    private Integer soTiet;

    @Column(name = "GHI_CHU", length = 255)
    private String ghiChu;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getThu() {
        return thu;
    }

    public void setThu(Integer thu) {
        this.thu = thu;
    }

    public Integer getTietBatDau() {
        return tietBatDau;
    }

    public void setTietBatDau(Integer tietBatDau) {
        this.tietBatDau = tietBatDau;
    }

    public Integer getSoTiet() {
        return soTiet;
    }

    public void setSoTiet(Integer soTiet) {
        this.soTiet = soTiet;
    }

    public String getGhiChu() {
        return ghiChu;
    }

    public void setGhiChu(String ghiChu) {
        this.ghiChu = ghiChu;
    }
}