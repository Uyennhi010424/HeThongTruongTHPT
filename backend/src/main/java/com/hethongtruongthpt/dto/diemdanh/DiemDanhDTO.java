package com.hethongtruongthpt.dto.diemdanh;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DiemDanhDTO {

    private Integer id;
    private LocalDate ngay;
    private Integer lopHocId;
    private Integer hocSinhId;
    private String hoTenHocSinh;
    private Integer tietHoc;
    private Integer monHocId;
    private String tenMonHoc;
    private String loaiVang;
    private Boolean coPhep;
    private Boolean khongPhep;
    private Integer soNgayVang;
    private String ghiChu;
    private Integer giaoVienId;
    private LocalDateTime createdAt;

    public DiemDanhDTO() {
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public LocalDate getNgay() { return ngay; }
    public void setNgay(LocalDate ngay) { this.ngay = ngay; }

    public Integer getLopHocId() { return lopHocId; }
    public void setLopHocId(Integer lopHocId) { this.lopHocId = lopHocId; }

    public Integer getHocSinhId() { return hocSinhId; }
    public void setHocSinhId(Integer hocSinhId) { this.hocSinhId = hocSinhId; }

    public String getHoTenHocSinh() { return hoTenHocSinh; }
    public void setHoTenHocSinh(String hoTenHocSinh) { this.hoTenHocSinh = hoTenHocSinh; }

    public Integer getTietHoc() { return tietHoc; }
    public void setTietHoc(Integer tietHoc) { this.tietHoc = tietHoc; }

    public Integer getMonHocId() { return monHocId; }
    public void setMonHocId(Integer monHocId) { this.monHocId = monHocId; }

    public String getTenMonHoc() { return tenMonHoc; }
    public void setTenMonHoc(String tenMonHoc) { this.tenMonHoc = tenMonHoc; }

    public String getLoaiVang() { return loaiVang; }
    public void setLoaiVang(String loaiVang) { this.loaiVang = loaiVang; }

    public Boolean getCoPhep() { return coPhep; }
    public void setCoPhep(Boolean coPhep) { this.coPhep = coPhep; }

    public Boolean getKhongPhep() { return khongPhep; }
    public void setKhongPhep(Boolean khongPhep) { this.khongPhep = khongPhep; }

    public Integer getSoNgayVang() { return soNgayVang; }
    public void setSoNgayVang(Integer soNgayVang) { this.soNgayVang = soNgayVang; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }

    public Integer getGiaoVienId() { return giaoVienId; }
    public void setGiaoVienId(Integer giaoVienId) { this.giaoVienId = giaoVienId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
