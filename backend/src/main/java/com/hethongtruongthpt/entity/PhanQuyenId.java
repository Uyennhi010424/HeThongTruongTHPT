package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class PhanQuyenId implements Serializable {
    @Column(name = "ID_ROLES")
    private Long rolesId;

    @Column(name = "ID_USER")
    private Long userId;

    public Long getRolesId() {
        return rolesId;
    }

    public void setRolesId(Long rolesId) {
        this.rolesId = rolesId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}