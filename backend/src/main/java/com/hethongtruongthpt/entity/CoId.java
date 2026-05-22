package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class CoId implements Serializable {
    @Column(name = "ID_HOCSINH")
    private Integer hocSinhId;

    @Column(name = "ID_QUOCTICH")
    private Integer quocTichId;

    public Integer getHocSinhId() {
        return hocSinhId;
    }

    public void setHocSinhId(Integer hocSinhId) {
        this.hocSinhId = hocSinhId;
    }

    public Integer getQuocTichId() {
        return quocTichId;
    }

    public void setQuocTichId(Integer quocTichId) {
        this.quocTichId = quocTichId;
    }
}