package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "DUOC_DANH_GIA")
public class DuocDanhGia {
    @EmbeddedId
    private DuocDanhGiaId id;

    public DuocDanhGiaId getId() {
        return id;
    }

    public void setId(DuocDanhGiaId id) {
        this.id = id;
    }
}