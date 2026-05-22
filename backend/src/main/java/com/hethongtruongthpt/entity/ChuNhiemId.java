package com.hethongtruongthpt.entity;
import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class ChuNhiemId implements Serializable {
    @Column(name = "ID_GIAOVIEN")
    private Integer giaoVienId;

    @Column(name = "ID_LOP")
    private Integer lopId;

    public Integer getGiaoVienId() {
        return giaoVienId;
    }

    public void setGiaoVienId(Integer giaoVienId) {
        this.giaoVienId = giaoVienId;
    }

    public Integer getLopId() {
        return lopId;
    }

    public void setLopId(Integer lopId) {
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