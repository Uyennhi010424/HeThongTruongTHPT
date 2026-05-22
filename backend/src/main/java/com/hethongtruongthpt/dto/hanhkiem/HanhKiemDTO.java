package com.hethongtruongthpt.dto.hanhkiem;

import com.hethongtruongthpt.enums.HanhKiemEnum;

import java.time.LocalDate;

public class HanhKiemDTO {
    private Integer id;
    private Integer hocSinhId;
    private Integer hocKy;
    private String namHoc;
    private String nhanXet;
    private HanhKiemEnum xepLoai;
    private Integer giaoVienId;
    private LocalDate ngayDanhGia;

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

    public String getNhanXet() {
        return nhanXet;
    }

    public void setNhanXet(String nhanXet) {
        this.nhanXet = nhanXet;
    }

    public HanhKiemEnum getXepLoai() {
        return xepLoai;
    }

    public void setXepLoai(HanhKiemEnum xepLoai) {
        this.xepLoai = xepLoai;
    }

    public Integer getGiaoVienId() {
        return giaoVienId;
    }

    public void setGiaoVienId(Integer giaoVienId) {
        this.giaoVienId = giaoVienId;
    }

    public LocalDate getNgayDanhGia() {
        return ngayDanhGia;
    }

    public void setNgayDanhGia(LocalDate ngayDanhGia) {
        this.ngayDanhGia = ngayDanhGia;
    }
}