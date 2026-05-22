package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class ApDungId implements Serializable {
    @Column(name = "ID_DIEM")
    private Integer diemId;

    @Column(name = "ID_HOCKY")
    private Integer hocKyId;

    public Integer getDiemId() {
        return diemId;
    }

    public void setDiemId(Integer diemId) {
        this.diemId = diemId;
    }

    public Integer getHocKyId() {
        return hocKyId;
    }

    public void setHocKyId(Integer hocKyId) {
        this.hocKyId = hocKyId;
    }
}