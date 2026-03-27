package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "MON_HOC")
public class MonHoc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_MONHOC")
    private Long id;

    @Column(name = "TEN_MONHOC", length = 100)
    private String tenMon;

    @Column(name = "HE_SO")
    private Double heSo;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTenMon() {
        return tenMon;
    }

    public void setTenMon(String tenMon) {
        this.tenMon = tenMon;
    }

    public Double getHeSo() {
        return heSo;
    }

    public void setHeSo(Double heSo) {
        this.heSo = heSo;
    }
}