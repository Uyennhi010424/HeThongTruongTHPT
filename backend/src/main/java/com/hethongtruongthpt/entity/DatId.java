package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class DatId implements Serializable {
    @Column(name = "ID_HOCSINH")
    private Integer hocSinhId;

    @Column(name = "ID_DIEM")
    private Integer diemId;

    public Integer getHocSinhId() {
        return hocSinhId;
    }

    public void setHocSinhId(Integer hocSinhId) {
        this.hocSinhId = hocSinhId;
    }

    public Integer getDiemId() {
        return diemId;
    }

    public void setDiemId(Integer diemId) {
        this.diemId = diemId;
    }
}