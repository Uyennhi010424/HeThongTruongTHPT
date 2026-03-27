package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class SoHuuTaiKhoanId implements Serializable {
    @Column(name = "ID_USER")
    private Long userId;

    @Column(name = "ID_HOCSINH")
    private Long hocSinhId;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getHocSinhId() {
        return hocSinhId;
    }

    public void setHocSinhId(Long hocSinhId) {
        this.hocSinhId = hocSinhId;
    }
}