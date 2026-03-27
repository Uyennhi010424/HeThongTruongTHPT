package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "DAT")
public class Dat {
    @EmbeddedId
    private DatId id;

    public DatId getId() {
        return id;
    }

    public void setId(DatId id) {
        this.id = id;
    }
}