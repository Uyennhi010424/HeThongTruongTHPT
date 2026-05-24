package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "phu_huynh")
public class PhuHuynh {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "ho_ten", length = 100, nullable = false)
    private String hoTen;

    @Column(name = "so_dien_thoai", length = 15, nullable = false)
    private String soDienThoai;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "nghe_nghiep", length = 200)
    private String ngheNghiep;

    @Column(name = "quan_he", nullable = false)
    private String quanHe; // CHA, ME, NGUOI_GIAM_HO

    @Column(name = "is_sms_active", nullable = false)
    private Boolean isSmSActive = true;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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