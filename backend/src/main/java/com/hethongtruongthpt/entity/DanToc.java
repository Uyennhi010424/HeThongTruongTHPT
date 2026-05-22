package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "DAN_TOC")
public class DanToc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_DANTOC")
    private Integer id;

    @Column(name = "TEN_DANTOC", length = 50)
    private String tenDanToc;

    @Column(name = "MO_TA", length = 255)
    private String moTa;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTenDanToc() {
        return tenDanToc;
    }

    public void setTenDanToc(String tenDanToc) {
        this.tenDanToc = tenDanToc;
    }

    public String getMoTa() {
        return moTa;
    }

    public void setMoTa(String moTa) {
        this.moTa = moTa;
    }
}