package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class ApDungTrongId implements Serializable {
    @Column(name = "ID_LOP")
    private Long lopId;

    @Column(name = "ID_NAMHOC")
    private Long namHocId;

    @Column(name = "ID_TKB")
    private Long tkbId;

    @Column(name = "ID_LICHTHI")
    private Long lichThiId;

    public Long getLopId() {
        return lopId;
    }

    public void setLopId(Long lopId) {
        this.lopId = lopId;
    }

    public Long getNamHocId() {
        return namHocId;
    }

    public void setNamHocId(Long namHocId) {
        this.namHocId = namHocId;
    }

    public Long getTkbId() {
        return tkbId;
    }

    public void setTkbId(Long tkbId) {
        this.tkbId = tkbId;
    }

    public Long getLichThiId() {
        return lichThiId;
    }

    public void setLichThiId(Long lichThiId) {
        this.lichThiId = lichThiId;
    }
}