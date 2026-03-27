package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "DANG_TAO")
public class DangTao {
    @EmbeddedId
    private DangTaoId id;

    public DangTaoId getId() {
        return id;
    }

    public void setId(DangTaoId id) {
        this.id = id;
    }
}