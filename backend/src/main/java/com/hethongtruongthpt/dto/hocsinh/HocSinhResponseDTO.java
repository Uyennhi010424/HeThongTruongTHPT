package com.hethongtruongthpt.dto.hocsinh;

import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.LopHoc;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class HocSinhResponseDTO {
    private Integer id;
    private String maHocSinh;
    private String hoTen;
    private LocalDate ngaySinh;
    private String gioiTinh;
    private LopHoc lop;
    private String diaChi;
    private Integer namNhapHoc;
    private String sdt;
    private String email;
    private String danToc;
    private String tonGiao;
    private String maBhyt;
    private Boolean dienChinhSach;
    private Integer trangThai;
    private Integer phuHuynhId;
    private String anhDaiDien;
    private LocalDateTime createdAt;

    public static HocSinhResponseDTO fromEntity(HocSinh hs) {
        if (hs == null) return null;
        HocSinhResponseDTO dto = new HocSinhResponseDTO();
        dto.setId(hs.getId());
        dto.setMaHocSinh(hs.getMaHocSinh());
        dto.setHoTen(hs.getHoTen());
        dto.setNgaySinh(hs.getNgaySinh());
        dto.setGioiTinh(hs.getGioiTinh());
        dto.setLop(hs.getLop());
        dto.setDiaChi(hs.getDiaChi());
        dto.setNamNhapHoc(hs.getNamNhapHoc());
        dto.setSdt(hs.getSdt());
        dto.setEmail(hs.getEmail());
        dto.setDanToc(hs.getDanToc());
        dto.setTonGiao(hs.getTonGiao());
        dto.setMaBhyt(hs.getMaBhyt());
        dto.setDienChinhSach(hs.getDienChinhSach());
        dto.setTrangThai(hs.getTrangThai());
        dto.setPhuHuynhId(hs.getPhuHuynhId());
        dto.setAnhDaiDien(hs.getAnhDaiDien());
        dto.setCreatedAt(hs.getCreatedAt());
        return dto;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getMaHocSinh() { return maHocSinh; }
    public void setMaHocSinh(String maHocSinh) { this.maHocSinh = maHocSinh; }
    public String getHoTen() { return hoTen; }
    public void setHoTen(String hoTen) { this.hoTen = hoTen; }
    public LocalDate getNgaySinh() { return ngaySinh; }
    public void setNgaySinh(LocalDate ngaySinh) { this.ngaySinh = ngaySinh; }
    public String getGioiTinh() { return gioiTinh; }
    public void setGioiTinh(String gioiTinh) { this.gioiTinh = gioiTinh; }
    public LopHoc getLop() { return lop; }
    public void setLop(LopHoc lop) { this.lop = lop; }
    public String getDiaChi() { return diaChi; }
    public void setDiaChi(String diaChi) { this.diaChi = diaChi; }
    public Integer getNamNhapHoc() { return namNhapHoc; }
    public void setNamNhapHoc(Integer namNhapHoc) { this.namNhapHoc = namNhapHoc; }
    public String getSdt() { return sdt; }
    public void setSdt(String sdt) { this.sdt = sdt; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDanToc() { return danToc; }
    public void setDanToc(String danToc) { this.danToc = danToc; }
    public String getTonGiao() { return tonGiao; }
    public void setTonGiao(String tonGiao) { this.tonGiao = tonGiao; }
    public String getMaBhyt() { return maBhyt; }
    public void setMaBhyt(String maBhyt) { this.maBhyt = maBhyt; }
    public Boolean getDienChinhSach() { return dienChinhSach; }
    public void setDienChinhSach(Boolean dienChinhSach) { this.dienChinhSach = dienChinhSach; }
    public Integer getTrangThai() { return trangThai; }
    public void setTrangThai(Integer trangThai) { this.trangThai = trangThai; }
    public Integer getPhuHuynhId() { return phuHuynhId; }
    public void setPhuHuynhId(Integer phuHuynhId) { this.phuHuynhId = phuHuynhId; }
    public String getAnhDaiDien() { return anhDaiDien; }
    public void setAnhDaiDien(String anhDaiDien) { this.anhDaiDien = anhDaiDien; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
