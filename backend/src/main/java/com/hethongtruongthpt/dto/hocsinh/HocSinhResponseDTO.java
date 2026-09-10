package com.hethongtruongthpt.dto.hocsinh;

import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.dto.lophoc.LopHocDTO;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class HocSinhResponseDTO {
    private Integer id;
    private String maHocSinh;
    private String hoTen;
    private LocalDate ngaySinh;
    private String gioiTinh;
    private LopHocDTO lop;
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
    private com.hethongtruongthpt.dto.phuhuynh.PhuHuynhDTO phuHuynh;
    private String anhDaiDien;
    private String truongChuyenDen;
    private java.util.List<String> namHocList;
    private LocalDateTime createdAt;

    public static HocSinhResponseDTO fromEntity(HocSinh hs) {
        if (hs == null) return null;
        HocSinhResponseDTO dto = new HocSinhResponseDTO();
        dto.setId(hs.getId());
        dto.setMaHocSinh(hs.getMaHocSinh());
        dto.setHoTen(hs.getHoTen());
        dto.setNgaySinh(hs.getNgaySinh());
        dto.setGioiTinh(hs.getGioiTinh());
        
        if (hs.getLop() != null) {
            LopHocDTO lopDto = new LopHocDTO();
            lopDto.setId(hs.getLop().getId());
            lopDto.setTenLop(hs.getLop().getTenLop());
            lopDto.setKhoi(hs.getLop().getKhoi());
            lopDto.setNamHoc(hs.getLop().getNamHoc());
            lopDto.setSiSo(hs.getLop().getSiSo());
            lopDto.setPhongHoc(hs.getLop().getPhongHoc());
            
            if (hs.getLop().getGvcn() != null) {
                com.hethongtruongthpt.dto.giaovien.GiaoVienDTO gvDto = new com.hethongtruongthpt.dto.giaovien.GiaoVienDTO();
                gvDto.setId(hs.getLop().getGvcn().getId());
                gvDto.setHoTen(hs.getLop().getGvcn().getHoTen());
                gvDto.setEmail(hs.getLop().getGvcn().getEmail());
                gvDto.setSdt(hs.getLop().getGvcn().getSoDienThoai());
                lopDto.setGvcn(gvDto);
            }
            
            dto.setLop(lopDto);
        }
        
        dto.setDiaChi(hs.getDiaChi());
        dto.setNamNhapHoc(hs.getNamNhapHoc());
        dto.setSdt(hs.getSdt());
        dto.setEmail(hs.getEmail());
        dto.setDanToc(hs.getDanToc() != null && !hs.getDanToc().isBlank() ? hs.getDanToc() : "Kinh");
        dto.setTonGiao(hs.getTonGiao() != null && !hs.getTonGiao().isBlank() ? hs.getTonGiao() : "Không");
        dto.setMaBhyt(hs.getMaBhyt());
        dto.setDienChinhSach(hs.getDienChinhSach());
        dto.setTrangThai(hs.getTrangThai());
        dto.setPhuHuynhId(hs.getPhuHuynhId());

        if (hs.getPhuHuynh() != null) {
            com.hethongtruongthpt.entity.PhuHuynh ph = hs.getPhuHuynh();
            com.hethongtruongthpt.dto.phuhuynh.PhuHuynhDTO phDto = new com.hethongtruongthpt.dto.phuhuynh.PhuHuynhDTO();
            phDto.setId(ph.getId());
            if (ph.getUser() != null) {
                phDto.setUserId(ph.getUser().getId());
            }
            phDto.setHoTen(ph.getHoTen());
            phDto.setSoDienThoai(ph.getSoDienThoai());
            phDto.setEmail(ph.getEmail());
            phDto.setNgheNghiep(ph.getNgheNghiep());
            phDto.setQuanHe(ph.getQuanHe());
            phDto.setIsSmSActive(ph.getIsSmSActive());
            dto.setPhuHuynh(phDto);
        }

        dto.setAnhDaiDien(hs.getAnhDaiDien());
        dto.setTruongChuyenDen(hs.getTruongChuyenDen());
        dto.setNamHocList(hs.getNamHocList());
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
    public LopHocDTO getLop() { return lop; }
    public void setLop(LopHocDTO lop) { this.lop = lop; }
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
    public com.hethongtruongthpt.dto.phuhuynh.PhuHuynhDTO getPhuHuynh() { return phuHuynh; }
    public void setPhuHuynh(com.hethongtruongthpt.dto.phuhuynh.PhuHuynhDTO phuHuynh) { this.phuHuynh = phuHuynh; }
    public String getAnhDaiDien() { return anhDaiDien; }
    public void setAnhDaiDien(String anhDaiDien) { this.anhDaiDien = anhDaiDien; }
    public String getTruongChuyenDen() { return truongChuyenDen; }
    public void setTruongChuyenDen(String truongChuyenDen) { this.truongChuyenDen = truongChuyenDen; }
    public java.util.List<String> getNamHocList() { return namHocList; }
    public void setNamHocList(java.util.List<String> namHocList) { this.namHocList = namHocList; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
