package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "DANH_GIA_HK")
public class DanhGiaHk {
    @EmbeddedId
    private DanhGiaHkId id;

    public DanhGiaHkId getId() {
        return id;
    }

    public void setId(DanhGiaHkId id) {
        this.id = id;
    }
}