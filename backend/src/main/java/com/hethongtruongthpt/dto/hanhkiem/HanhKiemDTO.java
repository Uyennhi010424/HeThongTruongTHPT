package com.hethongtruongthpt.dto.hanhkiem;

import com.hethongtruongthpt.enums.HanhKiemEnum;

import java.time.LocalDate;

public class HanhKiemDTO {
    private Long id;
    private Long hocSinhId;
    private Integer hocKy;
    private String namHoc;
    private String nhanXet;
    private HanhKiemEnum xepLoai;
    private Long giaoVienId;
    private LocalDate ngayDanhGia;

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

    public Long getGiaoVienId() {
        return giaoVienId;
    }

    public void setGiaoVienId(Long giaoVienId) {
        this.giaoVienId = giaoVienId;
    }

    public LocalDate getNgayDanhGia() {
        return ngayDanhGia;
    }

    public void setNgayDanhGia(LocalDate ngayDanhGia) {
        this.ngayDanhGia = ngayDanhGia;
    }
}