package com.hethongtruongthpt.dto.diem;

import com.hethongtruongthpt.enums.LoaiDiemEnum;

import java.time.LocalDate;

public class NhapDiemDTO {
    private Integer id;
    private Integer hocSinhId;
    private Integer monHocId;
    private LoaiDiemEnum loaiDiem;
    private Double diem;
    private Integer hocKy;
    private String namHoc;
    private Integer giaoVienId;
    private LocalDate ngayNhap;

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

    public Integer getMonHocId() {
        return monHocId;
    }

    public void setMonHocId(Integer monHocId) {
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

    public Integer getGiaoVienId() {
        return giaoVienId;
    }

    public void setGiaoVienId(Integer giaoVienId) {
        this.giaoVienId = giaoVienId;
    }

    public LocalDate getNgayNhap() {
        return ngayNhap;
    }

    public void setNgayNhap(LocalDate ngayNhap) {
        this.ngayNhap = ngayNhap;
    }
}