package com.hethongtruongthpt.entity;

import com.hethongtruongthpt.enums.ThongBaoDoiTuongEnum;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "THONG_BAO")
public class ThongBao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_THONGBAO")
    private Long id;

    @Column(name = "TIEU_DE", length = 50)
    private String tieuDe;

    @Column(name = "NOI_DUNG", length = 255)
    private String noiDung;

    @Enumerated(EnumType.STRING)
    @Column(name = "DOI_TUONG")
    private ThongBaoDoiTuongEnum doiTuong;

    @Column(name = "NGAY_DANG")
    private LocalDateTime ngayDang;

    @Column(name = "TRANG_THAI")
    private Integer trangThai;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
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

    public ThongBaoDoiTuongEnum getDoiTuong() {
        return doiTuong;
    }

    public void setDoiTuong(ThongBaoDoiTuongEnum doiTuong) {
        this.doiTuong = doiTuong;
    }

    public LocalDateTime getNgayDang() {
        return ngayDang;
    }

    public void setNgayDang(LocalDateTime ngayDang) {
        this.ngayDang = ngayDang;
    }

    public Integer getTrangThai() {
        return trangThai;
    }

    public void setTrangThai(Integer trangThai) {
        this.trangThai = trangThai;
    }
}