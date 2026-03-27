package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class GhiNhanTrongId implements Serializable {
    @Column(name = "ID_DIEM")
    private Long diemId;

    @Column(name = "ID_NAMHOC")
    private Long namHocId;

    public Long getDiemId() {
        return diemId;
    }

    public void setDiemId(Long diemId) {
        this.diemId = diemId;
    }

    public Long getNamHocId() {
        return namHocId;
    }

    public void setNamHocId(Long namHocId) {
        this.namHocId = namHocId;
    }
}