package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class NhamDenId implements Serializable {
    @Column(name = "ID_THONGBAO")
    private Long thongBaoId;

    @Column(name = "ID_ROLES")
    private Long rolesId;

    public Long getThongBaoId() {
        return thongBaoId;
    }

    public void setThongBaoId(Long thongBaoId) {
        this.thongBaoId = thongBaoId;
    }

    public Long getRolesId() {
        return rolesId;
    }

    public void setRolesId(Long rolesId) {
        this.rolesId = rolesId;
    }
}