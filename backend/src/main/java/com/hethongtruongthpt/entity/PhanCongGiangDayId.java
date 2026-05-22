package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class PhanCongGiangDayId implements Serializable {
    @Column(name = "ID_GIAOVIEN")
    private Integer giaoVienId;

    @Column(name = "ID_MONHOC")
    private Integer monHocId;

    @Column(name = "ID_LOP")
    private Integer lopId;

    @Column(name = "ID_NAMHOC")
    private Integer namHocId;

    @Column(name = "ID_TKB")
    private Integer tkbId;

    public Integer getGiaoVienId() {
        return giaoVienId;
    }

    public void setGiaoVienId(Integer giaoVienId) {
        this.giaoVienId = giaoVienId;
    }

    public Integer getMonHocId() {
        return monHocId;
    }

    public void setMonHocId(Integer monHocId) {
        this.monHocId = monHocId;
    }

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
}