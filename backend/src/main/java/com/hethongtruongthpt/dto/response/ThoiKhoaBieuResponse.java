package com.hethongtruongthpt.dto.response;

import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.entity.GiaoVien;

public class ThoiKhoaBieuResponse {
    private Integer id;
    private LopHocDto lop;
    private MonHocDto monHoc;
    private GiaoVienDto giaoVien;
    private Integer thu;
    private Integer tietBatDau;
    private Integer soTiet;
    private String phongHoc;
    private Integer hocKy;
    private String namHoc;
    private Integer tuan;
    private Boolean isLocked;
    private String ghiChu;
    private Boolean isDeleted;

    public static ThoiKhoaBieuResponse fromEntity(ThoiKhoaBieu tkb) {
        if (tkb == null) return null;
        ThoiKhoaBieuResponse res = new ThoiKhoaBieuResponse();
        res.setId(tkb.getId());
        res.setThu(tkb.getThu());
        res.setTietBatDau(tkb.getTietBatDau());
        res.setSoTiet(tkb.getSoTiet());
        res.setPhongHoc(tkb.getPhongHoc());
        res.setHocKy(tkb.getHocKy());
        res.setNamHoc(tkb.getNamHoc());
        res.setTuan(tkb.getTuan());
        res.setIsLocked(tkb.getIsLocked());
        res.setGhiChu(tkb.getGhiChu());
        res.setIsDeleted(tkb.getIsDeleted());

        if (tkb.getLop() != null) {
            LopHocDto lopDto = new LopHocDto();
            lopDto.setId(tkb.getLop().getId());
            lopDto.setTenLop(tkb.getLop().getTenLop());
            lopDto.setKhoi(tkb.getLop().getKhoi());
            res.setLop(lopDto);
        }

        if (tkb.getMonHoc() != null) {
            MonHocDto monDto = new MonHocDto();
            monDto.setId(tkb.getMonHoc().getId());
            monDto.setMaMon(tkb.getMonHoc().getMaMon());
            monDto.setTenMon(tkb.getMonHoc().getTenMon());
            res.setMonHoc(monDto);
        }

        if (tkb.getGiaoVien() != null) {
            GiaoVienDto gvDto = new GiaoVienDto();
            gvDto.setId(tkb.getGiaoVien().getId());
            gvDto.setMaGiaoVien(tkb.getGiaoVien().getMaGiaoVien());
            gvDto.setHoTen(tkb.getGiaoVien().getHoTen());
            res.setGiaoVien(gvDto);
        }

        return res;
    }

    public static class LopHocDto {
        private Integer id;
        private String tenLop;
        private Integer khoi;

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getTenLop() { return tenLop; }
        public void setTenLop(String tenLop) { this.tenLop = tenLop; }
        public Integer getKhoi() { return khoi; }
        public void setKhoi(Integer khoi) { this.khoi = khoi; }
    }

    public static class MonHocDto {
        private Integer id;
        private String maMon;
        private String tenMon;

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getMaMon() { return maMon; }
        public void setMaMon(String maMon) { this.maMon = maMon; }
        public String getTenMon() { return tenMon; }
        public void setTenMon(String tenMon) { this.tenMon = tenMon; }
    }

    public static class GiaoVienDto {
        private Integer id;
        private String maGiaoVien;
        private String hoTen;

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getMaGiaoVien() { return maGiaoVien; }
        public void setMaGiaoVien(String maGiaoVien) { this.maGiaoVien = maGiaoVien; }
        public String getHoTen() { return hoTen; }
        public void setHoTen(String hoTen) { this.hoTen = hoTen; }
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public LopHocDto getLop() { return lop; }
    public void setLop(LopHocDto lop) { this.lop = lop; }
    public MonHocDto getMonHoc() { return monHoc; }
    public void setMonHoc(MonHocDto monHoc) { this.monHoc = monHoc; }
    public GiaoVienDto getGiaoVien() { return giaoVien; }
    public void setGiaoVien(GiaoVienDto giaoVien) { this.giaoVien = giaoVien; }
    public Integer getThu() { return thu; }
    public void setThu(Integer thu) { this.thu = thu; }
    public Integer getTietBatDau() { return tietBatDau; }
    public void setTietBatDau(Integer tietBatDau) { this.tietBatDau = tietBatDau; }
    public Integer getSoTiet() { return soTiet; }
    public void setSoTiet(Integer soTiet) { this.soTiet = soTiet; }
    public String getPhongHoc() { return phongHoc; }
    public void setPhongHoc(String phongHoc) { this.phongHoc = phongHoc; }
    public Integer getHocKy() { return hocKy; }
    public void setHocKy(Integer hocKy) { this.hocKy = hocKy; }
    public String getNamHoc() { return namHoc; }
    public void setNamHoc(String namHoc) { this.namHoc = namHoc; }
    public Integer getTuan() { return tuan; }
    public void setTuan(Integer tuan) { this.tuan = tuan; }
    public Boolean getIsLocked() { return isLocked; }
    public void setIsLocked(Boolean isLocked) { this.isLocked = isLocked; }
    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }
    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }
}
