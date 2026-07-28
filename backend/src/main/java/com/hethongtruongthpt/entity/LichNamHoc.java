package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "lich_nam_hoc")
public class LichNamHoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ngay", nullable = false, unique = true)
    private LocalDate ngay;

    @Column(name = "loai_ngay", length = 50, nullable = false)
    private String loaiNgay; // e.g., STUDY, HOLIDAY, SUNDAY, TET, EXAM, OTHER_OFF

    @Column(name = "mo_ta", length = 255)
    private String moTa;

    @Column(name = "ngay_hoc", nullable = false)
    private Boolean ngayHoc;

    // Getters and Setters

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public LocalDate getNgay() {
        return ngay;
    }

    public void setNgay(LocalDate ngay) {
        this.ngay = ngay;
    }

    public String getLoaiNgay() {
        return loaiNgay;
    }

    public void setLoaiNgay(String loaiNgay) {
        this.loaiNgay = loaiNgay;
    }

    public String getMoTa() {
        return moTa;
    }

    public void setMoTa(String moTa) {
        this.moTa = moTa;
    }

    public Boolean getNgayHoc() {
        return ngayHoc;
    }

    public void setNgayHoc(Boolean ngayHoc) {
        this.ngayHoc = ngayHoc;
    }
}
