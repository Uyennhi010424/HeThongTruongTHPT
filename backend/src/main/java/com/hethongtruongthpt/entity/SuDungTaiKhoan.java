package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "SU_DUNG_TAI_KHOAN")
public class SuDungTaiKhoan {
    @EmbeddedId
    private SuDungTaiKhoanId id;

    public SuDungTaiKhoanId getId() {
        return id;
    }

    public void setId(SuDungTaiKhoanId id) {
        this.id = id;
    }
}