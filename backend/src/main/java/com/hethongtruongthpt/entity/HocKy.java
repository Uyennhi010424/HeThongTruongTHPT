package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "HOC_KY")
public class HocKy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_HOCKY")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ID_NAMHOC")
    private NamHoc namHoc;

    @Column(name = "TEN_HOCKY", length = 20)
    private String tenHocKy;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public NamHoc getNamHoc() {
        return namHoc;
    }

    public void setNamHoc(NamHoc namHoc) {
        this.namHoc = namHoc;
    }

    public String getTenHocKy() {
        return tenHocKy;
    }

    public void setTenHocKy(String tenHocKy) {
        this.tenHocKy = tenHocKy;
    }
}
