package com.hethongtruongthpt.dto.diem;

import com.hethongtruongthpt.enums.LoaiDiemEnum;

import java.time.LocalDate;

public class NhapDiemDTO {
    private Long id;
    private Long hocSinhId;
    private Long monHocId;
    private LoaiDiemEnum loaiDiem;
    private Double diem;
    private Integer hocKy;
    private String namHoc;
    private Long giaoVienId;
    private LocalDate ngayNhap;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getHocSinhId() {
        return hocSinhId;
    }

    public void setHocSinhId(Long hocSinhId) {
        this.hocSinhId = hocSinhId;
    }

    public Long getMonHocId() {
        return monHocId;
    }

    public void setMonHocId(Long monHocId) {
        this.monHocId = monHocId;
    }

    public LoaiDiemEnum getLoaiDiem() {
        return loaiDiem;
    }

    public void setLoaiDiem(LoaiDiemEnum loaiDiem) {
        this.loaiDiem = loaiDiem;
    }

    public Double getDiem() {
        return diem;
    }

    public void setDiem(Double diem) {
        this.diem = diem;
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

    public Long getGiaoVienId() {
        return giaoVienId;
    }

    public void setGiaoVienId(Long giaoVienId) {
        this.giaoVienId = giaoVienId;
    }

    public LocalDate getNgayNhap() {
        return ngayNhap;
    }

    public void setNgayNhap(LocalDate ngayNhap) {
        this.ngayNhap = ngayNhap;
    }
}