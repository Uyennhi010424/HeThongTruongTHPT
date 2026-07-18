package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_suggestions")
public class AiSuggestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "hoc_sinh_id", nullable = false)
    private Integer hocSinhId;

    @Column(name = "noi_dung_json", nullable = false, columnDefinition = "TEXT")
    private String noiDungJson;

    @Column(name = "hoc_ky", nullable = false)
    private Integer hocKy;

    @Column(name = "nam_hoc", nullable = false, length = 9)
    private String namHoc;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao;

    @Column(name = "het_han", nullable = false)
    private LocalDateTime hetHan;

    @Column(name = "mo_hinh_ai", nullable = false, length = 50)
    private String moHinhAi;

    @PrePersist
    public void prePersist() {
        if (this.ngayTao == null) {
            this.ngayTao = LocalDateTime.now();
        }
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getHocSinhId() {
        return hocSinhId;
    }

    public void setHocSinhId(Integer hocSinhId) {
        this.hocSinhId = hocSinhId;
    }

    public String getNoiDungJson() {
        return noiDungJson;
    }

    public void setNoiDungJson(String noiDungJson) {
        this.noiDungJson = noiDungJson;
    }

    public Integer getHocKy() {
        return hocKy;
    }

    public void setHocKy(Integer hocKy) {
        this.hocKy = hocKy;
    }

    public String getNamHoc() {
        return namHoc;
    }

    public void setNamHoc(String namHoc) {
        this.namHoc = namHoc;
    }

    public LocalDateTime getNgayTao() {
        return ngayTao;
    }

    public void setNgayTao(LocalDateTime ngayTao) {
        this.ngayTao = ngayTao;
    }

    public LocalDateTime getHetHan() {
        return hetHan;
    }

    public void setHetHan(LocalDateTime hetHan) {
        this.hetHan = hetHan;
    }

    public String getMoHinhAi() {
        return moHinhAi;
    }

    public void setMoHinhAi(String moHinhAi) {
        this.moHinhAi = moHinhAi;
    }
}
