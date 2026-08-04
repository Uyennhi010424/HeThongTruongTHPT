package com.hethongtruongthpt.dto.baikiemtra;

import java.time.LocalDateTime;
import java.util.List;

public class BaiKiemTraDTO {
    private Integer id;
    private String tieuDe;
    private Integer thoiGianLamBai;
    private LocalDateTime thoiGianBatDau;
    private LocalDateTime thoiGianKetThuc;
    private Integer lopHocId;
    private String tenLopHoc;
    private Integer monHocId;
    private String tenMonHoc;
    private Integer giaoVienId;
    private String tenGiaoVien;
    private LocalDateTime ngayTao;
    private List<CauHoiDTO> cauHois;
    private Integer soLanLamBai;
    private String trangThaiLamBai;
    private Double diemDatDuoc;

    public BaiKiemTraDTO() {}

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
    public Integer getLopHocId() { return lopHocId; }
    public void setLopHocId(Integer lopHocId) { this.lopHocId = lopHocId; }
    public String getTenLopHoc() { return tenLopHoc; }
    public void setTenLopHoc(String tenLopHoc) { this.tenLopHoc = tenLopHoc; }
    public Integer getMonHocId() { return monHocId; }
    public void setMonHocId(Integer monHocId) { this.monHocId = monHocId; }
    public String getTenMonHoc() { return tenMonHoc; }
    public void setTenMonHoc(String tenMonHoc) { this.tenMonHoc = tenMonHoc; }
    public Integer getGiaoVienId() { return giaoVienId; }
    public void setGiaoVienId(Integer giaoVienId) { this.giaoVienId = giaoVienId; }
    public String getTenGiaoVien() { return tenGiaoVien; }
    public void setTenGiaoVien(String tenGiaoVien) { this.tenGiaoVien = tenGiaoVien; }
    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }
    public List<CauHoiDTO> getCauHois() { return cauHois; }
    public void setCauHois(List<CauHoiDTO> cauHois) { this.cauHois = cauHois; }
    public Integer getSoLanLamBai() { return soLanLamBai; }
    public void setSoLanLamBai(Integer soLanLamBai) { this.soLanLamBai = soLanLamBai; }
    public String getTrangThaiLamBai() { return trangThaiLamBai; }
    public void setTrangThaiLamBai(String trangThaiLamBai) { this.trangThaiLamBai = trangThaiLamBai; }
    public Double getDiemDatDuoc() { return diemDatDuoc; }
    public void setDiemDatDuoc(Double diemDatDuoc) { this.diemDatDuoc = diemDatDuoc; }
}
