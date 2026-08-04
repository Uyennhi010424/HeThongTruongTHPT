package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bai_kiem_tra")
public class BaiKiemTra {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "tieu_de", length = 255, nullable = false)
    private String tieuDe;

    @Column(name = "thoi_gian_lam_bai", nullable = false)
    private Integer thoiGianLamBai; // minutes

    @Column(name = "thoi_gian_bat_dau")
    private LocalDateTime thoiGianBatDau;

    @Column(name = "thoi_gian_ket_thuc")
    private LocalDateTime thoiGianKetThuc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lop_hoc_id", nullable = false)
    private LopHoc lopHoc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mon_hoc_id", nullable = false)
    private MonHoc monHoc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "giao_vien_id", nullable = false)
    private GiaoVien giaoVien;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao = LocalDateTime.now();

    @Column(name = "da_thong_bao")
    private Boolean daThongBao = false;

    @Column(name = "so_lan_lam_bai", columnDefinition = "INT DEFAULT 1")
    private Integer soLanLamBai = 1;

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getTieuDe() { return tieuDe; }
    public void setTieuDe(String tieuDe) { this.tieuDe = tieuDe; }
    public Integer getThoiGianLamBai() { return thoiGianLamBai; }
    public void setThoiGianLamBai(Integer thoiGianLamBai) { this.thoiGianLamBai = thoiGianLamBai; }
    public LocalDateTime getThoiGianBatDau() { return thoiGianBatDau; }
    public void setThoiGianBatDau(LocalDateTime thoiGianBatDau) { this.thoiGianBatDau = thoiGianBatDau; }
    public LocalDateTime getThoiGianKetThuc() { return thoiGianKetThuc; }
    public void setThoiGianKetThuc(LocalDateTime thoiGianKetThuc) { this.thoiGianKetThuc = thoiGianKetThuc; }
    public LopHoc getLopHoc() { return lopHoc; }
    public void setLopHoc(LopHoc lopHoc) { this.lopHoc = lopHoc; }
    public MonHoc getMonHoc() { return monHoc; }
    public void setMonHoc(MonHoc monHoc) { this.monHoc = monHoc; }
    public GiaoVien getGiaoVien() { return giaoVien; }
    public void setGiaoVien(GiaoVien giaoVien) { this.giaoVien = giaoVien; }
    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }
    public Boolean getDaThongBao() { return daThongBao; }
    public void setDaThongBao(Boolean daThongBao) { this.daThongBao = daThongBao; }
    public Integer getSoLanLamBai() { return soLanLamBai; }
    public void setSoLanLamBai(Integer soLanLamBai) { this.soLanLamBai = soLanLamBai; }
}
