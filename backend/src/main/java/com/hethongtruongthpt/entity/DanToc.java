package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "dan_toc")
public class DanToc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_dantoc")
    private Integer id;

    @Column(name = "ten_dantoc", length = 50, nullable = false)
    private String tenDanToc;

    @Column(name = "mo_ta", length = 255)
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