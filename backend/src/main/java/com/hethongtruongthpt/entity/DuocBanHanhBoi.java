package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "DUOC_BAN_HANH_BOI")
public class DuocBanHanhBoi {
    @EmbeddedId
    private DuocBanHanhBoiId id;

    public DuocBanHanhBoiId getId() {
        return id;
    }

    public void setId(DuocBanHanhBoiId id) {
        this.id = id;
    }
}