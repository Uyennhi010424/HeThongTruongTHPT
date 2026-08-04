package com.hethongtruongthpt.dto.baikiemtra;

import java.time.LocalDateTime;
import java.util.List;

public class BaiLamDTO {
    private Integer id;
    private Integer baiKiemTraId;
    private Integer hocSinhId;
    private String tenHocSinh;
    private String maHocSinh;
    private LocalDateTime thoiGianBatDau;
    private LocalDateTime thoiGianNop;
    private String trangThai;
    private Double diemTracNghiem;
    private Double diemTuLuan;
    private Double tongDiem;
    private List<ChiTietBaiLamDTO> chiTietBaiLams;

    public BaiLamDTO() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getBaiKiemTraId() { return baiKiemTraId; }
    public void setBaiKiemTraId(Integer baiKiemTraId) { this.baiKiemTraId = baiKiemTraId; }
    public Integer getHocSinhId() { return hocSinhId; }
    public void setHocSinhId(Integer hocSinhId) { this.hocSinhId = hocSinhId; }
    public String getTenHocSinh() { return tenHocSinh; }
    public void setTenHocSinh(String tenHocSinh) { this.tenHocSinh = tenHocSinh; }
    public String getMaHocSinh() { return maHocSinh; }
    public void setMaHocSinh(String maHocSinh) { this.maHocSinh = maHocSinh; }
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
    public Double getTongDiem() { return (diemTracNghiem != null ? diemTracNghiem : 0) + (diemTuLuan != null ? diemTuLuan : 0); }
    public void setTongDiem(Double tongDiem) { this.tongDiem = tongDiem; }
    public List<ChiTietBaiLamDTO> getChiTietBaiLams() { return chiTietBaiLams; }
    public void setChiTietBaiLams(List<ChiTietBaiLamDTO> chiTietBaiLams) { this.chiTietBaiLams = chiTietBaiLams; }
}
