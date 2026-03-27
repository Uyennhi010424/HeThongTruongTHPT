package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "DANH_GIA")
public class DanhGia {
    @EmbeddedId
    private DanhGiaId id;

    public DanhGiaId getId() {
        return id;
    }

    public void setId(DanhGiaId id) {
        this.id = id;
    }
}