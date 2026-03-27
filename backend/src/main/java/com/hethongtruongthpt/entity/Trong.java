package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "TRONG")
public class Trong {
    @EmbeddedId
    private TrongId id;

    public TrongId getId() {
        return id;
    }

    public void setId(TrongId id) {
        this.id = id;
    }
}