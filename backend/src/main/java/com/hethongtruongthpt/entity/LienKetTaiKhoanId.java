package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class LienKetTaiKhoanId implements Serializable {
    @Column(name = "ID_PHUHUYNH")
    private Long phuHuynhId;

    @Column(name = "ID_USER")
    private Long userId;

    public Long getPhuHuynhId() {
        return phuHuynhId;
    }

    public void setPhuHuynhId(Long phuHuynhId) {
        this.phuHuynhId = phuHuynhId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}