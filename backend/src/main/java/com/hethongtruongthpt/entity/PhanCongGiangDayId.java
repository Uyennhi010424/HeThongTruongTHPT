package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class PhanCongGiangDayId implements Serializable {
    @Column(name = "ID_GIAOVIEN")
    private Long giaoVienId;

    @Column(name = "ID_MONHOC")
    private Long monHocId;

    @Column(name = "ID_LOP")
    private Long lopId;

    @Column(name = "ID_NAMHOC")
    private Long namHocId;

    @Column(name = "ID_TKB")
    private Long tkbId;

    public Long getGiaoVienId() {
        return giaoVienId;
    }

    public void setGiaoVienId(Long giaoVienId) {
        this.giaoVienId = giaoVienId;
    }

    public Long getMonHocId() {
        return monHocId;
    }

    public void setMonHocId(Long monHocId) {
        this.monHocId = monHocId;
    }

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
}