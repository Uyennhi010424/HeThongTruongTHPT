package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "CHU_NHIEM")
public class ChuNhiem {
    @EmbeddedId
    private ChuNhiemId id;

    public ChuNhiemId getId() {
        return id;
    }

    public void setId(ChuNhiemId id) {
        this.id = id;
    }
}