package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "PHAN_QUYEN")
public class PhanQuyen {
    @EmbeddedId
    private PhanQuyenId id;

    public PhanQuyenId getId() {
        return id;
    }

    public void setId(PhanQuyenId id) {
        this.id = id;
    }
}