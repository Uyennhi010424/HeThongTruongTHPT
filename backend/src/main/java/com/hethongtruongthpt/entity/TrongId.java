package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class TrongId implements Serializable {
    @Column(name = "ID_HANHKIEM")
    private Long hanhKiemId;

    @Column(name = "ID_HOCKY")
    private Long hocKyId;

    @Column(name = "ID_NAMHOC")
    private Long namHocId;

    public Long getHanhKiemId() {
        return hanhKiemId;
    }

    public void setHanhKiemId(Long hanhKiemId) {
        this.hanhKiemId = hanhKiemId;
    }

    public Long getHocKyId() {
        return hocKyId;
    }

    public void setHocKyId(Long hocKyId) {
        this.hocKyId = hocKyId;
    }

    public Long getNamHocId() {
        return namHocId;
    }

    public void setNamHocId(Long namHocId) {
        this.namHocId = namHocId;
    }
}