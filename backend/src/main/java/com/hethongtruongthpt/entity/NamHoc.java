package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "NAM_HOC")
public class NamHoc {
    @Id
    @Column(name = "ID_NAMHOC")
    private Long id;

    @Column(name = "TEN_NAMHOC", length = 9)
    private String tenNamHoc;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTenNamHoc() {
        return tenNamHoc;
    }

    public void setTenNamHoc(String tenNamHoc) {
        this.tenNamHoc = tenNamHoc;
    }
}