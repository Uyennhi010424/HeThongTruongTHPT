package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class DuocBanHanhBoiId implements Serializable {
    @Column(name = "ID_VANBAN")
    private Integer vanBanId;

    @Column(name = "ID_USER")
    private Integer userId;

    public Integer getVanBanId() {
        return vanBanId;
    }

    public void setVanBanId(Integer vanBanId) {
        this.vanBanId = vanBanId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }
}