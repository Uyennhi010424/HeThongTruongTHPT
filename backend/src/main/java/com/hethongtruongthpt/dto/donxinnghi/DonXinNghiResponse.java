package com.hethongtruongthpt.dto.donxinnghi;

import com.hethongtruongthpt.entity.DonXinNghi;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DonXinNghiResponse {
    private Integer id;
    private Integer hocSinhId;
    private String tenHocSinh;
    private String tenLop;
    private Integer phuHuynhId;
    private String tenPhuHuynh;
    private LocalDate ngayBatDau;
    private LocalDate ngayKetThuc;
    private String lyDo;
    private String trangThai;
    private String phanHoiGv;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DonXinNghiResponse fromEntity(DonXinNghi entity) {
        DonXinNghiResponse res = new DonXinNghiResponse();
        res.setId(entity.getId());
        res.setHocSinhId(entity.getHocSinh().getId());
        res.setTenHocSinh(entity.getHocSinh().getHoTen());
        if (entity.getHocSinh().getLop() != null) {
            res.setTenLop(entity.getHocSinh().getLop().getTenLop());
        }
        if (entity.getPhuHuynh() != null) {
            res.setPhuHuynhId(entity.getPhuHuynh().getId());
            res.setTenPhuHuynh(entity.getPhuHuynh().getHoTen());
        }
        res.setNgayBatDau(entity.getNgayBatDau());
        res.setNgayKetThuc(entity.getNgayKetThuc());
        res.setLyDo(entity.getLyDo());
        res.setTrangThai(entity.getTrangThai());
        res.setPhanHoiGv(entity.getPhanHoiGv());
        res.setCreatedAt(entity.getCreatedAt());
        res.setUpdatedAt(entity.getUpdatedAt());
        return res;
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getHocSinhId() { return hocSinhId; }
    public void setHocSinhId(Integer hocSinhId) { this.hocSinhId = hocSinhId; }
    public String getTenHocSinh() { return tenHocSinh; }
    public void setTenHocSinh(String tenHocSinh) { this.tenHocSinh = tenHocSinh; }
    public String getTenLop() { return tenLop; }
    public void setTenLop(String tenLop) { this.tenLop = tenLop; }
    public Integer getPhuHuynhId() { return phuHuynhId; }
    public void setPhuHuynhId(Integer phuHuynhId) { this.phuHuynhId = phuHuynhId; }
    public String getTenPhuHuynh() { return tenPhuHuynh; }
    public void setTenPhuHuynh(String tenPhuHuynh) { this.tenPhuHuynh = tenPhuHuynh; }
    public LocalDate getNgayBatDau() { return ngayBatDau; }
    public void setNgayBatDau(LocalDate ngayBatDau) { this.ngayBatDau = ngayBatDau; }
    public LocalDate getNgayKetThuc() { return ngayKetThuc; }
    public void setNgayKetThuc(LocalDate ngayKetThuc) { this.ngayKetThuc = ngayKetThuc; }
    public String getLyDo() { return lyDo; }
    public void setLyDo(String lyDo) { this.lyDo = lyDo; }
    public String getTrangThai() { return trangThai; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }
    public String getPhanHoiGv() { return phanHoiGv; }
    public void setPhanHoiGv(String phanHoiGv) { this.phanHoiGv = phanHoiGv; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
