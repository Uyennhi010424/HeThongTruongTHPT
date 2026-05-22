package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class ApDungTrongId implements Serializable {
    @Column(name = "ID_LOP")
    private Integer lopId;

    @Column(name = "ID_NAMHOC")
    private Integer namHocId;

    @Column(name = "ID_TKB")
    private Integer tkbId;

    @Column(name = "ID_LICHTHI")
    private Integer lichThiId;

    public Integer getLopId() {
        return lopId;
    }

    public void setLopId(Integer lopId) {
        this.lopId = lopId;
    }

    public Integer getNamHocId() {
        return namHocId;
    }

    public void setNamHocId(Integer namHocId) {
        this.namHocId = namHocId;
    }

    public Integer getTkbId() {
        return tkbId;
    }

    public void setTkbId(Integer tkbId) {
        this.tkbId = tkbId;
    }

    public Integer getLichThiId() {
        return lichThiId;
    }

    public void setLichThiId(Integer lichThiId) {
        this.lichThiId = lichThiId;
    }
}