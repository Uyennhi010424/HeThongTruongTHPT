package com.hethongtruongthpt.dto.lichthi;

import java.time.LocalDate;
import java.time.LocalTime;

public class LichThiDTO {

    private Integer id;
    private Integer lopId;
    private Integer monHocId;
    private String loaiKiemTra;
    private LocalDate ngayThi;
    private LocalTime gioBatDau;
    private Integer thoiGianLamBai;
    private String phongThi;
    private String ghiChu;
    private Integer hocKy;
    private String namHoc;

    public LichThiDTO() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getLopId() {
        return lopId;
    }

    public void setLopId(Integer lopId) {
        this.lopId = lopId;
    }

    public Integer getMonHocId() {
        return monHocId;
    }

    public void setMonHocId(Integer monHocId) {
        this.monHocId = monHocId;
    }

    public String getLoaiKiemTra() {
        return loaiKiemTra;
    }

    public void setLoaiKiemTra(String loaiKiemTra) {
        this.loaiKiemTra = loaiKiemTra;
    }

    public LocalDate getNgayThi() {
        return ngayThi;
    }

    public void setNgayThi(LocalDate ngayThi) {
        this.ngayThi = ngayThi;
    }

    public LocalTime getGioBatDau() {
        return gioBatDau;
    }

    public void setGioBatDau(LocalTime gioBatDau) {
        this.gioBatDau = gioBatDau;
    }

    public Integer getThoiGianLamBai() {
        return thoiGianLamBai;
    }

    public void setThoiGianLamBai(Integer thoiGianLamBai) {
        this.thoiGianLamBai = thoiGianLamBai;
    }

    public String getPhongThi() {
        return phongThi;
    }

    public void setPhongThi(String phongThi) {
        this.phongThi = phongThi;
    }

    public String getGhiChu() {
        return ghiChu;
    }

    public void setGhiChu(String ghiChu) {
        this.ghiChu = ghiChu;
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
}
