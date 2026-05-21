package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "thong_bao")
public class ThongBao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "tieu_de", length = 255, nullable = false)
    private String tieuDe;

    @Column(name = "noi_dung", nullable = false, columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "loai", nullable = false)
    private String loai; // CHUNG, LOP, CA_NHAN

    @ManyToOne
    @JoinColumn(name = "lop_id")
    private LopHoc lop;

    @ManyToOne
    @JoinColumn(name = "hoc_sinh_id")
    private HocSinh hocSinh;

    @ManyToOne
    @JoinColumn(name = "nguoi_tao_id", nullable = false)
    private User nguoiTao;

    @Column(name = "ngay_dang", nullable = false)
    private LocalDateTime ngayDang;

    @Column(name = "han_hien_thi")
    private LocalDateTime hanHienThi;

    @PrePersist
    public void prePersist() {
        this.ngayDang = LocalDateTime.now();
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTieuDe() {
        return tieuDe;
    }

    public void setTieuDe(String tieuDe) {
        this.tieuDe = tieuDe;
    }

    public String getNoiDung() {
        return noiDung;
    }

    public void setNoiDung(String noiDung) {
        this.noiDung = noiDung;
    }

    public String getLoai() {
        return loai;
    }

    public void setLoai(String loai) {
        this.loai = loai;
    }

    public LopHoc getLop() {
        return lop;
    }

    public void setLop(LopHoc lop) {
        this.lop = lop;
    }

    public HocSinh getHocSinh() {
        return hocSinh;
    }

    public void setHocSinh(HocSinh hocSinh) {
        this.hocSinh = hocSinh;
    }

    public User getNguoiTao() {
        return nguoiTao;
    }

    public void setNguoiTao(User nguoiTao) {
        this.nguoiTao = nguoiTao;
    }

    public LocalDateTime getNgayDang() {
        return ngayDang;
    }

    public void setNgayDang(LocalDateTime ngayDang) {
        this.ngayDang = ngayDang;
    }

    public LocalDateTime getHanHienThi() {
        return hanHienThi;
    }

    public void setHanHienThi(LocalDateTime hanHienThi) {
        this.hanHienThi = hanHienThi;
    }
}