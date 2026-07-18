package com.hethongtruongthpt.dto.phuhuynh;

public class PhuHuynhDTO {

    private Integer id;
    private Integer userId;
    private String hoTen;
    private String soDienThoai;
    private String email;
    private String ngheNghiep;
    private String quanHe;
    private Boolean isSmSActive;

    public PhuHuynhDTO() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getHoTen() {
        return hoTen;
    }

    public void setHoTen(String hoTen) {
        this.hoTen = hoTen;
    }

    public String getSoDienThoai() {
        return soDienThoai;
    }

    public void setSoDienThoai(String soDienThoai) {
        this.soDienThoai = soDienThoai;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNgheNghiep() {
        return ngheNghiep;
    }

    public void setNgheNghiep(String ngheNghiep) {
        this.ngheNghiep = ngheNghiep;
    }

    public String getQuanHe() {
        return quanHe;
    }

    public void setQuanHe(String quanHe) {
        this.quanHe = quanHe;
    }

    public Boolean getIsSmSActive() {
        return isSmSActive;
    }

    public void setIsSmSActive(Boolean isSmSActive) {
        this.isSmSActive = isSmSActive;
    }
}
