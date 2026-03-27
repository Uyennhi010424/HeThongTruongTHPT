package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "GHI_NHAN_TRONG")
public class GhiNhanTrong {
    @EmbeddedId
    private GhiNhanTrongId id;

    public GhiNhanTrongId getId() {
        return id;
    }

    public void setId(GhiNhanTrongId id) {
        this.id = id;
    }
}