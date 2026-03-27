package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class DuocBanHanhBoiId implements Serializable {
    @Column(name = "ID_VANBAN")
    private Long vanBanId;

    @Column(name = "ID_USER")
    private Long userId;

    public Long getVanBanId() {
        return vanBanId;
    }

    public void setVanBanId(Long vanBanId) {
        this.vanBanId = vanBanId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}