package com.hethongtruongthpt.dto.giaovien;

import java.time.LocalDate;

public class GiaoVienDTO {
    private Integer id;
    private String maGiaoVien;
    private String hoTen;
    private String email;
    private String sdt;
    private String boMon;
    private String trinhDo;
    private Boolean gioiTinh;
    private LocalDate ngaySinh;
    private String diaChi;
    private String username;
    private Boolean isGvcn;
    private String tenLopChuNhiem;
    private Integer lopChuNhiemId;
    private String anhDaiDien;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getMaGiaoVien() {
        return maGiaoVien;
    }

    public void setMaGiaoVien(String maGiaoVien) {
        this.maGiaoVien = maGiaoVien;
    }

    public String getHoTen() {
        return hoTen;
    }

    public void setHoTen(String hoTen) {
        this.hoTen = hoTen;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSdt() {
        return sdt;
    }

    public void setSdt(String sdt) {
        this.sdt = sdt;
    }

    public String getBoMon() {
        return boMon;
    }

    public void setBoMon(String boMon) {
        this.boMon = boMon;
    }

    public String getTrinhDo() {
        return trinhDo;
    }

    public void setTrinhDo(String trinhDo) {
        this.trinhDo = trinhDo;
    }

    public Boolean getGioiTinh() {
        return gioiTinh;
    }

    public void setGioiTinh(Boolean gioiTinh) {
        this.gioiTinh = gioiTinh;
    }

    public LocalDate getNgaySinh() {
        return ngaySinh;
    }

    public void setNgaySinh(LocalDate ngaySinh) {
        this.ngaySinh = ngaySinh;
    }

    public String getDiaChi() {
        return diaChi;
    }

    public void setDiaChi(String diaChi) {
        this.diaChi = diaChi;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Boolean getIsGvcn() {
        return isGvcn;
    }

    public void setIsGvcn(Boolean isGvcn) {
        this.isGvcn = isGvcn;
    }

    public String getTenLopChuNhiem() {
        return tenLopChuNhiem;
    }

    public void setTenLopChuNhiem(String tenLopChuNhiem) {
        this.tenLopChuNhiem = tenLopChuNhiem;
    }

    public String getAnhDaiDien() {
        return anhDaiDien;
    }

    public void setAnhDaiDien(String anhDaiDien) {
        this.anhDaiDien = anhDaiDien;
    }

    public Integer getLopChuNhiemId() {
        return lopChuNhiemId;
    }

    public void setLopChuNhiemId(Integer lopChuNhiemId) {
        this.lopChuNhiemId = lopChuNhiemId;
    }
}
