package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "HOC_KY")
public class HocKy {
    @Id
    @Column(name = "ID_HOCKY")
    private Integer id;

    @Column(name = "TEN_HOCKY", length = 20)
    private String tenHocKy;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTenHocKy() {
        return tenHocKy;
    }

    public void setTenHocKy(String tenHocKy) {
        this.tenHocKy = tenHocKy;
    }
}