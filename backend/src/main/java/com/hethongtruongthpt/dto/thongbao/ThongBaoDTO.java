package com.hethongtruongthpt.dto.thongbao;

import java.time.LocalDateTime;

public class ThongBaoDTO {

    private Integer id;
    private String tieuDe;
    private String noiDung;
    private String loai;
    private Integer lopId;
    private Integer hocSinhId;
    private Integer nguoiTaoId;
    private LocalDateTime ngayDang;
    private LocalDateTime hanHienThi;

    public ThongBaoDTO() {
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

    public Integer getLopId() {
        return lopId;
    }

    public void setLopId(Integer lopId) {
        this.lopId = lopId;
    }

    public Integer getHocSinhId() {
        return hocSinhId;
    }

    public void setHocSinhId(Integer hocSinhId) {
        this.hocSinhId = hocSinhId;
    }

    public Integer getNguoiTaoId() {
        return nguoiTaoId;
    }

    public void setNguoiTaoId(Integer nguoiTaoId) {
        this.nguoiTaoId = nguoiTaoId;
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
