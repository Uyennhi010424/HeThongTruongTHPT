package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class DatId implements Serializable {
    @Column(name = "ID_HOCSINH")
    private Long hocSinhId;

    @Column(name = "ID_DIEM")
    private Long diemId;

    public Long getHocSinhId() {
        return hocSinhId;
    }

    public void setHocSinhId(Long hocSinhId) {
        this.hocSinhId = hocSinhId;
    }

    public Long getDiemId() {
        return diemId;
    }

    public void setDiemId(Long diemId) {
        this.diemId = diemId;
    }
}