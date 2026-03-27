package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "QUOC_TICH")
public class QuocTich {
    @Id
    @Column(name = "ID_QUOCTICH")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "TEN_QUOCTICH", length = 50)
    private String tenQuocTich;

    @Column(name = "MO_TA", length = 255)
    private String moTa;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTenQuocTich() {
        return tenQuocTich;
    }

    public void setTenQuocTich(String tenQuocTich) {
        this.tenQuocTich = tenQuocTich;
    }

    public String getMoTa() {
        return moTa;
    }

    public void setMoTa(String moTa) {
        this.moTa = moTa;
    }
}