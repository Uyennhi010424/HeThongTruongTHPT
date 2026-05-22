package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class DangTaoId implements Serializable {
    @Column(name = "ID_USER")
    private Integer userId;

    @Column(name = "ID_THONGBAO")
    private Integer thongBaoId;

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getThongBaoId() {
        return thongBaoId;
    }

    public void setThongBaoId(Integer thongBaoId) {
        this.thongBaoId = thongBaoId;
    }
}