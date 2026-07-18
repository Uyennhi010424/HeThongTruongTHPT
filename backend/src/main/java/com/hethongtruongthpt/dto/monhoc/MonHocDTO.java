package com.hethongtruongthpt.dto.monhoc;

public class MonHocDTO {

    private Integer id;
    private String tenMon;
    private String maMon;
    private String nhomDanhGia;
    private Integer soDtxHocKy;
    private String khoiApDung;
    private String moTa;
    private Boolean isActive;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTenMon() {
        return tenMon;
    }

    public void setTenMon(String tenMon) {
        this.tenMon = tenMon;
    }

    public String getMaMon() {
        return maMon;
    }

    public void setMaMon(String maMon) {
        this.maMon = maMon;
    }

    public String getNhomDanhGia() {
        return nhomDanhGia;
    }

    public void setNhomDanhGia(String nhomDanhGia) {
        this.nhomDanhGia = nhomDanhGia;
    }

    public Integer getSoDtxHocKy() {
        return soDtxHocKy;
    }

    public void setSoDtxHocKy(Integer soDtxHocKy) {
        this.soDtxHocKy = soDtxHocKy;
    }

    public String getKhoiApDung() {
        return khoiApDung;
    }

    public void setKhoiApDung(String khoiApDung) {
        this.khoiApDung = khoiApDung;
    }

    public String getMoTa() {
        return moTa;
    }

    public void setMoTa(String moTa) {
        this.moTa = moTa;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
