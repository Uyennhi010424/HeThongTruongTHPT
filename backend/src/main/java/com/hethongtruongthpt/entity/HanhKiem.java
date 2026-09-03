package com.hethongtruongthpt.entity;

import com.hethongtruongthpt.enums.HanhKiemEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

@Entity
@Table(name = "HANH_KIEM")
public class HanhKiem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_HANHKIEM")
    private Integer id;

    @ManyToOne(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinColumn(name = "ID_HOCSINH", nullable = false)
    private HocSinh hocSinh;

    @ManyToOne(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinColumn(name = "ID_GIAOVIEN")
    private GiaoVien giaoVien;

    @ManyToOne(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinColumn(name = "ID_NAMHOC")
    private NamHoc namHoc;

    @NotNull(message = "Học kỳ không được để trống")
    @Min(value = 1, message = "Học kỳ phải là 1 hoặc 2")
    @Max(value = 2, message = "Học kỳ phải là 1 hoặc 2")
    @Column(name = "HOC_KY")
    private Integer hocKy;

    @NotNull(message = "Xếp loại không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "XEP_LOAI")
    private HanhKiemEnum xepLoai;

    @Column(name = "NHAN_XET", length = 255)
    private String nhanXet;

    @Column(name = "NGAY_DANH_GIA")
    private LocalDate ngayDanhGia;

    @Column(name = "status", length = 20)
    private String status = "DRAFT"; // DRAFT, APPROVED

    public String getStatus() {
        return status == null ? "DRAFT" : status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public HocSinh getHocSinh() {
        return hocSinh;
    }

    public void setHocSinh(HocSinh hocSinh) {
        this.hocSinh = hocSinh;
    }

    public GiaoVien getGiaoVien() {
        return giaoVien;
    }

    public void setGiaoVien(GiaoVien giaoVien) {
        this.giaoVien = giaoVien;
    }

    public NamHoc getNamHoc() {
        return namHoc;
    }

    public void setNamHoc(NamHoc namHoc) {
        this.namHoc = namHoc;
    }

    public Integer getHocKy() {
        return hocKy;
    }

    public void setHocKy(Integer hocKy) {
        this.hocKy = hocKy;
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
