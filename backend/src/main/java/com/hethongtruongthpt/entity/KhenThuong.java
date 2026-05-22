package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "KHEN_THUONG")
public class KhenThuong {
    @Id
    @Column(name = "ID_KHENTHUONG")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "NOI_DUNG", length = 255)
    private String noiDung;

    @Column(name = "NGAY_KHEN")
    private LocalDate ngayKhen;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNoiDung() {
        return noiDung;
    }

    public void setNoiDung(String noiDung) {
        this.noiDung = noiDung;
    }

    public LocalDate getNgayKhen() {
        return ngayKhen;
    }

    public void setNgayKhen(LocalDate ngayKhen) {
        this.ngayKhen = ngayKhen;
    }
}