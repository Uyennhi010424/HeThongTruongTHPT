package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class DanhGiaHkId implements Serializable {
    @Column(name = "ID_HANHKIEM")
    private Integer hanhKiemId;

    @Column(name = "ID_GIAOVIEN")
    private Integer giaoVienId;

    @Column(name = "ID_VIPHAM")
    private Integer viPhamId;

    @Column(name = "ID_KHENTHUONG")
    private Integer khenThuongId;

    public Integer getHanhKiemId() {
        return hanhKiemId;
    }

    public void setHanhKiemId(Integer hanhKiemId) {
        this.hanhKiemId = hanhKiemId;
    }

    public Integer getGiaoVienId() {
        return giaoVienId;
    }

    public void setGiaoVienId(Integer giaoVienId) {
        this.giaoVienId = giaoVienId;
    }

    public Integer getViPhamId() {
        return viPhamId;
    }

    public void setViPhamId(Integer viPhamId) {
        this.viPhamId = viPhamId;
    }

    public Integer getKhenThuongId() {
        return khenThuongId;
    }

    public void setKhenThuongId(Integer khenThuongId) {
        this.khenThuongId = khenThuongId;
    }
}