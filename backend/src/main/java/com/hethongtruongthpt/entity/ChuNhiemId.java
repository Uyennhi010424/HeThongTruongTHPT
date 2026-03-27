package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ChuNhiemId implements Serializable {
    @Column(name = "ID_GIAOVIEN")
    private Long giaoVienId;

    @Column(name = "ID_LOP")
    private Long lopId;

    public Long getGiaoVienId() {
        return giaoVienId;
    }

    public void setGiaoVienId(Long giaoVienId) {
        this.giaoVienId = giaoVienId;
    }

    public Long getLopId() {
        return lopId;
    }

    public void setLopId(Long lopId) {
        this.lopId = lopId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ChuNhiemId that = (ChuNhiemId) o;
        return Objects.equals(giaoVienId, that.giaoVienId)
                && Objects.equals(lopId, that.lopId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(giaoVienId, lopId);
    }
}