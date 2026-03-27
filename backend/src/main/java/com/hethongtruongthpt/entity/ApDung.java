package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "AP_DUNG")
public class ApDung {
    @EmbeddedId
    private ApDungId id;

    public ApDungId getId() {
        return id;
    }

    public void setId(ApDungId id) {
        this.id = id;
    }
}