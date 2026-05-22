package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class DanhGiaId implements Serializable {
    @Column(name = "ID_MONHOC")
    private Integer monHocId;

    @Column(name = "ID_DIEM")
    private Integer diemId;

    public Integer getMonHocId() {
        return monHocId;
    }

    public void setMonHocId(Integer monHocId) {
        this.monHocId = monHocId;
    }

    public Integer getDiemId() {
        return diemId;
    }

    public void setDiemId(Integer diemId) {
        this.diemId = diemId;
    }
}