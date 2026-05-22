package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "ROLES")
public class Roles {
    @Id
    @Column(name = "ID_ROLES")
    private Integer id;

    @Column(name = "ROLE_NAME", length = 30)
    private String roleName;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }
}