package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class NhamDenId implements Serializable {
    @Column(name = "ID_THONGBAO")
    private Integer thongBaoId;

    @Column(name = "ID_ROLES")
    private Integer rolesId;

    public Integer getThongBaoId() {
        return thongBaoId;
    }

    public void setThongBaoId(Integer thongBaoId) {
        this.thongBaoId = thongBaoId;
    }

    public Integer getRolesId() {
        return rolesId;
    }

    public void setRolesId(Integer rolesId) {
        this.rolesId = rolesId;
    }
}