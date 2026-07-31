package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "lich_thi")
public class LichThi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinColumn(name = "lop_id", nullable = false)
    private LopHoc lop;

    @ManyToOne(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinColumn(name = "mon_hoc_id", nullable = false)
    private MonHoc monHoc;

    @Column(name = "loai_kiem_tra", nullable = false)
    private String loaiKiemTra; // GK, CK, TX

    @Column(name = "ngay_thi", nullable = false)
    private LocalDate ngayThi;

    @Column(name = "gio_bat_dau", nullable = false)
    private LocalTime gioBatDau;

    @Column(name = "thoi_gian_lam_bai", nullable = false)
    private Integer thoiGianLamBai; // Phút

    @Column(name = "phong_thi", length = 20)
    private String phongThi;

    @Column(name = "ghi_chu")
    private String ghiChu;

    @ManyToOne(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinColumn(name = "giam_thi_1_id")
    private GiaoVien giamThi1;

    @ManyToOne(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinColumn(name = "giam_thi_2_id")
    private GiaoVien giamThi2;

    @Column(name = "hoc_ky", nullable = false)
    private Integer hocKy;

    @Column(name = "nam_hoc", length = 9, nullable = false)
    private String namHoc;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public LopHoc getLop() {
        return lop;
    }

    public void setLop(LopHoc lop) {
        this.lop = lop;
    }

    public MonHoc getMonHoc() {
        return monHoc;
    }

    public void setMonHoc(MonHoc monHoc) {
        this.monHoc = monHoc;
    }

    public String getLoaiKiemTra() {
        return loaiKiemTra;
    }

    public void setLoaiKiemTra(String loaiKiemTra) {
        this.loaiKiemTra = loaiKiemTra;
    }

    public LocalDate getNgayThi() {
        return ngayThi;
    }

    public void setNgayThi(LocalDate ngayThi) {
        this.ngayThi = ngayThi;
    }

    public LocalTime getGioBatDau() {
        return gioBatDau;
    }

    public void setGioBatDau(LocalTime gioBatDau) {
        this.gioBatDau = gioBatDau;
    }

    public Integer getThoiGianLamBai() {
        return thoiGianLamBai;
    }

    public void setThoiGianLamBai(Integer thoiGianLamBai) {
        this.thoiGianLamBai = thoiGianLamBai;
    }

    public String getPhongThi() {
        return phongThi;
    }

    public void setPhongThi(String phongThi) {
        this.phongThi = phongThi;
    }

    public String getGhiChu() {
        return ghiChu;
    }

    public void setGhiChu(String ghiChu) {
        this.ghiChu = ghiChu;
    }

    public GiaoVien getGiamThi1() {
        return giamThi1;
    }

    public void setGiamThi1(GiaoVien giamThi1) {
        this.giamThi1 = giamThi1;
    }

    public GiaoVien getGiamThi2() {
        return giamThi2;
    }

    public void setGiamThi2(GiaoVien giamThi2) {
        this.giamThi2 = giamThi2;
    }

    public Integer getHocKy() {
        return hocKy;
    }

    public void setHocKy(Integer hocKy) {
        this.hocKy = hocKy;
    }

    public String getNamHoc() {
        return namHoc;
    }

    public void setNamHoc(String namHoc) {
        this.namHoc = namHoc;
    }
}