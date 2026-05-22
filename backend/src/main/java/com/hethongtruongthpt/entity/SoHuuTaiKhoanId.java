package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class SoHuuTaiKhoanId implements Serializable {
    @Column(name = "ID_USER")
    private Integer userId;

    @Column(name = "ID_HOCSINH")
    private Integer hocSinhId;

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getHocSinhId() {
        return hocSinhId;
    }

    public void setHocSinhId(Integer hocSinhId) {
        this.hocSinhId = hocSinhId;
    }
}