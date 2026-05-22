package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class GhiNhanTrongId implements Serializable {
    @Column(name = "ID_DIEM")
    private Integer diemId;

    @Column(name = "ID_NAMHOC")
    private Integer namHocId;

    public Integer getDiemId() {
        return diemId;
    }

    public void setDiemId(Integer diemId) {
        this.diemId = diemId;
    }

    public Integer getNamHocId() {
        return namHocId;
    }

    public void setNamHocId(Integer namHocId) {
        this.namHocId = namHocId;
    }
}