package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "AP_DUNG_TRONG")
public class ApDungTrong {
    @EmbeddedId
    private ApDungTrongId id;

    public ApDungTrongId getId() {
        return id;
    }

    public void setId(ApDungTrongId id) {
        this.id = id;
    }
}