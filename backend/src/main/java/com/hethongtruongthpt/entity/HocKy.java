package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "HOC_KY")
public class HocKy {
    @Id
    @Column(name = "ID_HOCKY")
    private Long id;

    @Column(name = "TEN_HOCKY", length = 20)
    private String tenHocKy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTenHocKy() {
        return tenHocKy;
    }

    public void setTenHocKy(String tenHocKy) {
        this.tenHocKy = tenHocKy;
    }
}