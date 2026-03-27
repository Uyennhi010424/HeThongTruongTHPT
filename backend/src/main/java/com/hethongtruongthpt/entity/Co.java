package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "CO")
public class Co {
    @EmbeddedId
    private CoId id;

    public CoId getId() {
        return id;
    }

    public void setId(CoId id) {
        this.id = id;
    }
}