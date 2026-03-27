package com.hethongtruongthpt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "PHAN_CONG_GIANG_DAY")
public class PhanCongGiangDay {
    @EmbeddedId
    private PhanCongGiangDayId id;

    public PhanCongGiangDayId getId() {
        return id;
    }

    public void setId(PhanCongGiangDayId id) {
        this.id = id;
    }
}