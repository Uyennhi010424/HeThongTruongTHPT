package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "NHAM_DEN")
public class NhamDen {
    @EmbeddedId
    private NhamDenId id;

    public NhamDenId getId() {
        return id;
    }

    public void setId(NhamDenId id) {
        this.id = id;
    }
}