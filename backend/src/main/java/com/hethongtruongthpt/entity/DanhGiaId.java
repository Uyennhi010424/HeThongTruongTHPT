package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class DanhGiaId implements Serializable {
    @Column(name = "ID_MONHOC")
    private Long monHocId;

    @Column(name = "ID_DIEM")
    private Long diemId;

    public Long getMonHocId() {
        return monHocId;
    }

    public void setMonHocId(Long monHocId) {
        this.monHocId = monHocId;
    }

    public Long getDiemId() {
        return diemId;
    }

    public void setDiemId(Long diemId) {
        this.diemId = diemId;
    }
}