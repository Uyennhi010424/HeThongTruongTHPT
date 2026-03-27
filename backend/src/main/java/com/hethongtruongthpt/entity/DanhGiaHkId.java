package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class DanhGiaHkId implements Serializable {
    @Column(name = "ID_HANHKIEM")
    private Long hanhKiemId;

    @Column(name = "ID_GIAOVIEN")
    private Long giaoVienId;

    @Column(name = "ID_VIPHAM")
    private Long viPhamId;

    @Column(name = "ID_KHENTHUONG")
    private Long khenThuongId;

    public Long getHanhKiemId() {
        return hanhKiemId;
    }

    public void setHanhKiemId(Long hanhKiemId) {
        this.hanhKiemId = hanhKiemId;
    }

    public Long getGiaoVienId() {
        return giaoVienId;
    }

    public void setGiaoVienId(Long giaoVienId) {
        this.giaoVienId = giaoVienId;
    }

    public Long getViPhamId() {
        return viPhamId;
    }

    public void setViPhamId(Long viPhamId) {
        this.viPhamId = viPhamId;
    }

    public Long getKhenThuongId() {
        return khenThuongId;
    }

    public void setKhenThuongId(Long khenThuongId) {
        this.khenThuongId = khenThuongId;
    }
}