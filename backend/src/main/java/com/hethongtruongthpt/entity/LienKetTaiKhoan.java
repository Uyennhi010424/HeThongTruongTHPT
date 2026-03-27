package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "LIEN_KET_TAI_KHOAN")
public class LienKetTaiKhoan {
    @EmbeddedId
    private LienKetTaiKhoanId id;

    public LienKetTaiKhoanId getId() {
        return id;
    }

    public void setId(LienKetTaiKhoanId id) {
        this.id = id;
    }
}