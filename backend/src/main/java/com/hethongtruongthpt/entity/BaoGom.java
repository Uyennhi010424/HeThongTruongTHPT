package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "BAO_GOM")
public class BaoGom {
    @EmbeddedId
    private BaoGomId id;

    public BaoGomId getId() {
        return id;
    }

    public void setId(BaoGomId id) {
        this.id = id;
    }
}