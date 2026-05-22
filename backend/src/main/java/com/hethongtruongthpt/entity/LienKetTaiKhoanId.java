package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class LienKetTaiKhoanId implements Serializable {
    @Column(name = "ID_PHUHUYNH")
    private Integer phuHuynhId;

    @Column(name = "ID_USER")
    private Integer userId;

    public Integer getPhuHuynhId() {
        return phuHuynhId;
    }

    public void setPhuHuynhId(Integer phuHuynhId) {
        this.phuHuynhId = phuHuynhId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }
}