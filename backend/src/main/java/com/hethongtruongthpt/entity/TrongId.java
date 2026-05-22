package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class TrongId implements Serializable {
    @Column(name = "ID_HANHKIEM")
    private Integer hanhKiemId;

    @Column(name = "ID_HOCKY")
    private Integer hocKyId;

    @Column(name = "ID_NAMHOC")
    private Integer namHocId;

    public Integer getHanhKiemId() {
        return hanhKiemId;
    }

    public void setHanhKiemId(Integer hanhKiemId) {
        this.hanhKiemId = hanhKiemId;
    }

    public Integer getHocKyId() {
        return hocKyId;
    }

    public void setHocKyId(Integer hocKyId) {
        this.hocKyId = hocKyId;
    }

    public Integer getNamHocId() {
        return namHocId;
    }

    public void setNamHocId(Integer namHocId) {
        this.namHocId = namHocId;
    }
}