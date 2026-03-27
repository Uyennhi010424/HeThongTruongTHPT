package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "SO_HUU_TAI_KHOAN")
public class SoHuuTaiKhoan {
    @EmbeddedId
    private SoHuuTaiKhoanId id;

    public SoHuuTaiKhoanId getId() {
        return id;
    }

    public void setId(SoHuuTaiKhoanId id) {
        this.id = id;
    }
}