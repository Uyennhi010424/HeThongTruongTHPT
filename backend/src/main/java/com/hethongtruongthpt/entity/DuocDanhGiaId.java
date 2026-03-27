package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class DuocDanhGiaId implements Serializable {
    @Column(name = "ID_HANHKIEM")
    private Long hanhKiemId;

    @Column(name = "ID_HOCSINH")
    private Long hocSinhId;

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

    public Long getHocSinhId() {
        return hocSinhId;
    }

    public void setHocSinhId(Long hocSinhId) {
        this.hocSinhId = hocSinhId;
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