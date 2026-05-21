package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_suggestions")
public class AiSuggestions {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "hoc_sinh_id", nullable = false)
    private HocSinh hocSinh;

    @Column(name = "noi_dung_json", nullable = false, columnDefinition = "TEXT")
    private String noiDungJson; // 3 gợi ý dạng JSON array

    @Column(name = "hoc_ky", nullable = false)
    private Integer hocKy;

    @Column(name = "nam_hoc", length = 9, nullable = false)
    private String namHoc;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "het_han", nullable = false)
    private LocalDateTime hetHan; // TTL 24h sau ngay_tao

    @Column(name = "mo_hinh_ai", length = 50, nullable = false)
    private String moHinhAi = "gemini-1.5-flash";

    @PrePersist
    public void prePersist() {
        this.ngayTao = LocalDateTime.now();
        if (this.hetHan == null && this.ngayTao != null) {
            this.hetHan = this.ngayTao.plusHours(24);
        }
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public HocSinh getHocSinh() {
        return hocSinh;
    }

    public void setHocSinh(HocSinh hocSinh) {
        this.hocSinh = hocSinh;
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
