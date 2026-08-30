package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "ton_giao")
public class TonGiao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tongiao")
    private Integer id;

    @Column(name = "ten_tongiao", length = 50, nullable = false)
    private String tenTonGiao;

    @Column(name = "mo_ta", length = 255)
    private String moTa;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTenTonGiao() {
        return tenTonGiao;
    }

    public void setTenTonGiao(String tenTonGiao) {
        this.tenTonGiao = tenTonGiao;
    }

    public String getMoTa() {
        return moTa;
    }

    public void setMoTa(String moTa) {
        this.moTa = moTa;
    }
}
