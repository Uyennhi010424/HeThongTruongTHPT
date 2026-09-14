package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "nam_hoc")
public class NamHoc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "ten_nam_hoc", length = 9, nullable = false, unique = true)
    private String tenNamHoc;

    @Column(name = "ngay_bat_dau_hk1", nullable = false)
    private LocalDate ngayBatDauHk1;

    @Column(name = "ngay_ket_thuc_hk1", nullable = false)
    private LocalDate ngayKetThucHk1;

    @Column(name = "ngay_bat_dau_hk2", nullable = false)
    private LocalDate ngayBatDauHk2;

    @Column(name = "ngay_ket_thuc_hk2", nullable = false)
    private LocalDate ngayKetThucHk2;

    @Column(name = "deadline_nhap_diem_hk1", nullable = false)
    private LocalDate deadlineNhapDiemHk1;

    @Column(name = "deadline_nhap_diem_hk2", nullable = false)
    private LocalDate deadlineNhapDiemHk2;

    @Column(name = "ngay_bat_dau_hk1_goc")
    private LocalDate ngayBatDauHk1Goc;

    @Column(name = "ngay_ket_thuc_hk1_goc")
    private LocalDate ngayKetThucHk1Goc;

    @Column(name = "deadline_nhap_diem_hk1_goc")
    private LocalDate deadlineNhapDiemHk1Goc;

    @Column(name = "ngay_bat_dau_hk2_goc")
    private LocalDate ngayBatDauHk2Goc;

    @Column(name = "ngay_ket_thuc_hk2_goc")
    private LocalDate ngayKetThucHk2Goc;

    @Column(name = "deadline_nhap_diem_hk2_goc")
    private LocalDate deadlineNhapDiemHk2Goc;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai = "DANG_MO"; // DANG_MO or DA_DONG

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTenNamHoc() {
        return tenNamHoc;
    }

    public void setTenNamHoc(String tenNamHoc) {
        this.tenNamHoc = tenNamHoc;
    }

    public LocalDate getNgayBatDauHk1() {
        return ngayBatDauHk1;
    }

    public void setNgayBatDauHk1(LocalDate ngayBatDauHk1) {
        this.ngayBatDauHk1 = ngayBatDauHk1;
    }

    public LocalDate getNgayKetThucHk1() {
        return ngayKetThucHk1;
    }

    public void setNgayKetThucHk1(LocalDate ngayKetThucHk1) {
        this.ngayKetThucHk1 = ngayKetThucHk1;
    }

    public LocalDate getNgayBatDauHk2() {
        return ngayBatDauHk2;
    }

    public void setNgayBatDauHk2(LocalDate ngayBatDauHk2) {
        this.ngayBatDauHk2 = ngayBatDauHk2;
    }

    public LocalDate getNgayKetThucHk2() {
        return ngayKetThucHk2;
    }

    public void setNgayKetThucHk2(LocalDate ngayKetThucHk2) {
        this.ngayKetThucHk2 = ngayKetThucHk2;
    }

    public LocalDate getDeadlineNhapDiemHk1() {
        return deadlineNhapDiemHk1;
    }

    public void setDeadlineNhapDiemHk1(LocalDate deadlineNhapDiemHk1) {
        this.deadlineNhapDiemHk1 = deadlineNhapDiemHk1;
    }

    public LocalDate getDeadlineNhapDiemHk2() {
        return deadlineNhapDiemHk2;
    }

    public void setDeadlineNhapDiemHk2(LocalDate deadlineNhapDiemHk2) {
        this.deadlineNhapDiemHk2 = deadlineNhapDiemHk2;
    }

    public LocalDate getNgayBatDauHk1Goc() {
        return ngayBatDauHk1Goc;
    }

    public void setNgayBatDauHk1Goc(LocalDate ngayBatDauHk1Goc) {
        this.ngayBatDauHk1Goc = ngayBatDauHk1Goc;
    }

    public LocalDate getNgayKetThucHk1Goc() {
        return ngayKetThucHk1Goc;
    }

    public void setNgayKetThucHk1Goc(LocalDate ngayKetThucHk1Goc) {
        this.ngayKetThucHk1Goc = ngayKetThucHk1Goc;
    }

    public LocalDate getDeadlineNhapDiemHk1Goc() {
        return deadlineNhapDiemHk1Goc;
    }

    public void setDeadlineNhapDiemHk1Goc(LocalDate deadlineNhapDiemHk1Goc) {
        this.deadlineNhapDiemHk1Goc = deadlineNhapDiemHk1Goc;
    }

    public LocalDate getNgayBatDauHk2Goc() {
        return ngayBatDauHk2Goc;
    }

    public void setNgayBatDauHk2Goc(LocalDate ngayBatDauHk2Goc) {
        this.ngayBatDauHk2Goc = ngayBatDauHk2Goc;
    }

    public LocalDate getNgayKetThucHk2Goc() {
        return ngayKetThucHk2Goc;
    }

    public void setNgayKetThucHk2Goc(LocalDate ngayKetThucHk2Goc) {
        this.ngayKetThucHk2Goc = ngayKetThucHk2Goc;
    }

    public LocalDate getDeadlineNhapDiemHk2Goc() {
        return deadlineNhapDiemHk2Goc;
    }

    public void setDeadlineNhapDiemHk2Goc(LocalDate deadlineNhapDiemHk2Goc) {
        this.deadlineNhapDiemHk2Goc = deadlineNhapDiemHk2Goc;
    }

    public String getTrangThai() {
        return trangThai;
    }

    public void setTrangThai(String trangThai) {
        this.trangThai = trangThai;
    }
}