package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "HOC_BA")
public class HocBa {
    @Id
    @Column(name = "ID_HOCBA")
    private Long id;

    @Column(name = "ID_NAMHOC")
    private Long namHocId;

    @Column(name = "HOC_LUC", length = 20)
    private String hocLuc;

    @Column(name = "HANH_KIEM", length = 20)
    private String hanhKiem;

    @Column(name = "GHI_CHU", length = 255)
    private String ghiChu;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getNamHocId() {
        return namHocId;
    }

    public void setNamHocId(Long namHocId) {
        this.namHocId = namHocId;
    }

    public String getHocLuc() {
        return hocLuc;
    }

    public void setHocLuc(String hocLuc) {
        this.hocLuc = hocLuc;
    }

    public String getHanhKiem() {
        return hanhKiem;
    }

    public void setHanhKiem(String hanhKiem) {
        this.hanhKiem = hanhKiem;
    }

    public String getGhiChu() {
        return ghiChu;
    }

    public void setGhiChu(String ghiChu) {
        this.ghiChu = ghiChu;
    }
}