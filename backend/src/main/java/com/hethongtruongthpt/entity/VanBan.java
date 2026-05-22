package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "VAN_BAN")
public class VanBan {
    @Id
    @Column(name = "ID_VANBAN")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "SO_HIEU", length = 20)
    private String soHieu;

    @Column(name = "LOAI_VAN_BAN", length = 50)
    private String loaiVanBan;

    @Column(name = "NGAY_BAN_HANH")
    private LocalDate ngayBanHanh;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getSoHieu() {
        return soHieu;
    }

    public void setSoHieu(String soHieu) {
        this.soHieu = soHieu;
    }

    public String getLoaiVanBan() {
        return loaiVanBan;
    }

    public void setLoaiVanBan(String loaiVanBan) {
        this.loaiVanBan = loaiVanBan;
    }

    public LocalDate getNgayBanHanh() {
        return ngayBanHanh;
    }

    public void setNgayBanHanh(LocalDate ngayBanHanh) {
        this.ngayBanHanh = ngayBanHanh;
    }
}