package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class ApDungId implements Serializable {
    @Column(name = "ID_DIEM")
    private Long diemId;

    @Column(name = "ID_HOCKY")
    private Long hocKyId;

    public Long getDiemId() {
        return diemId;
    }

    public void setDiemId(Long diemId) {
        this.diemId = diemId;
    }

    public Long getHocKyId() {
        return hocKyId;
    }

    public void setHocKyId(Long hocKyId) {
        this.hocKyId = hocKyId;
    }
}