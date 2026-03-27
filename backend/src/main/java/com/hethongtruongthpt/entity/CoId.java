package com.hethongtruongthpt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class CoId implements Serializable {
    @Column(name = "ID_HOCSINH")
    private Long hocSinhId;

    @Column(name = "ID_QUOCTICH")
    private Long quocTichId;

    public Long getHocSinhId() {
        return hocSinhId;
    }

    public void setHocSinhId(Long hocSinhId) {
        this.hocSinhId = hocSinhId;
    }

    public Long getQuocTichId() {
        return quocTichId;
    }

    public void setQuocTichId(Long quocTichId) {
        this.quocTichId = quocTichId;
    }
}