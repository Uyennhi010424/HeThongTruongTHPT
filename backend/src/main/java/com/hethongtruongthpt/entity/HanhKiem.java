package com.hethongtruongthpt.entity;

import com.hethongtruongthpt.enums.HanhKiemEnum;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "HANH_KIEM")
public class HanhKiem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_HANHKIEM")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "XEP_LOAI")
    private HanhKiemEnum xepLoai;

    @Column(name = "NHAN_XET", length = 255)
    private String nhanXet;

    @Column(name = "NGAY_DANH_GIA")
    private LocalDate ngayDanhGia;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDate getNgayDanhGia() {
        return ngayDanhGia;
    }

    public void setNgayDanhGia(LocalDate ngayDanhGia) {
        this.ngayDanhGia = ngayDanhGia;
    }
}