package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class BaoGomId implements Serializable {
    @Column(name = "ID_TKB")
    private Long tkbId;

    @Column(name = "ID_HOCKY")
    private Long hocKyId;

    @Column(name = "ID_NAMHOC")
    private Long namHocId;

    @Column(name = "ID_LICHTHI")
    private Long lichThiId;

    public Long getTkbId() {
        return tkbId;
    }

    public void setTkbId(Long tkbId) {
        this.tkbId = tkbId;
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

    public Long getLichThiId() {
        return lichThiId;
    }

    public void setLichThiId(Long lichThiId) {
        this.lichThiId = lichThiId;
    }
}