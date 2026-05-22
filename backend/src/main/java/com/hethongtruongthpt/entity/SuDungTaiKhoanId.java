package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class SuDungTaiKhoanId implements Serializable {
    @Column(name = "ID_USER")
    private Integer userId;

    @Column(name = "ID_GIAOVIEN")
    private Integer giaoVienId;

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getGiaoVienId() {
        return giaoVienId;
    }

    public void setGiaoVienId(Integer giaoVienId) {
        this.giaoVienId = giaoVienId;
    }
}