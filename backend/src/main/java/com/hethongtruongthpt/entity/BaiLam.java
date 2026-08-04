package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bai_lam")
public class BaiLam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bai_kiem_tra_id", nullable = false)
    private BaiKiemTra baiKiemTra;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoc_sinh_id", nullable = false)
    private HocSinh hocSinh;

    @Column(name = "thoi_gian_bat_dau", nullable = false)
    private LocalDateTime thoiGianBatDau;

    @Column(name = "thoi_gian_nop")
    private LocalDateTime thoiGianNop;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai = "DANG_LAM"; // DANG_LAM, DA_NOP, VI_PHAM_QUY_CHE

    @Column(name = "diem_trac_nghiem")
    private Double diemTracNghiem = 0.0;

    @Column(name = "diem_tu_luan")
    private Double diemTuLuan = 0.0;

    @Column(name = "session_token")
    private String sessionToken;

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public BaiKiemTra getBaiKiemTra() { return baiKiemTra; }
    public void setBaiKiemTra(BaiKiemTra baiKiemTra) { this.baiKiemTra = baiKiemTra; }
    public HocSinh getHocSinh() { return hocSinh; }
    public void setHocSinh(HocSinh hocSinh) { this.hocSinh = hocSinh; }
    public LocalDateTime getThoiGianBatDau() { return thoiGianBatDau; }
    public void setThoiGianBatDau(LocalDateTime thoiGianBatDau) { this.thoiGianBatDau = thoiGianBatDau; }
    public LocalDateTime getThoiGianNop() { return thoiGianNop; }
    public void setThoiGianNop(LocalDateTime thoiGianNop) { this.thoiGianNop = thoiGianNop; }
    public String getTrangThai() { return trangThai; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }
    public Double getDiemTracNghiem() { return diemTracNghiem; }
    public void setDiemTracNghiem(Double diemTracNghiem) { this.diemTracNghiem = diemTracNghiem; }
    public Double getDiemTuLuan() { return diemTuLuan; }
    public void setDiemTuLuan(Double diemTuLuan) { this.diemTuLuan = diemTuLuan; }
    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String sessionToken) { this.sessionToken = sessionToken; }
}
