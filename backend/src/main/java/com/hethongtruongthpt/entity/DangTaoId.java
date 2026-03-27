package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class DangTaoId implements Serializable {
    @Column(name = "ID_USER")
    private Long userId;

    @Column(name = "ID_THONGBAO")
    private Long thongBaoId;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getThongBaoId() {
        return thongBaoId;
    }

    public void setThongBaoId(Long thongBaoId) {
        this.thongBaoId = thongBaoId;
    }
}