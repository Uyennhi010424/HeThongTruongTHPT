package com.hethongtruongthpt.dto.diem;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DiemAuditLogDTO {

    private Integer id;
    private Integer diemId;
    private Integer hocSinhId;
    private String hoTenHocSinh;
    private Integer monHocId;
    private String tenMonHoc;
    private BigDecimal giaTriCu;
    private BigDecimal giaTriMoi;
    private String hanhDong;
    private Integer giaoVienId;
    private String hoTenGiaoVien;
    private LocalDateTime thoiGian;
    private String lyDo;
    private String ipAddress;

    // Nested objects for frontend compatibility
    private GiaoVienInfo giaoVien;
    private HocSinhInfo hocSinh;
    private MonHocInfo monHoc;

    public DiemAuditLogDTO() {
    }

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getDiemId() { return diemId; }
    public void setDiemId(Integer diemId) { this.diemId = diemId; }

    public Integer getHocSinhId() { return hocSinhId; }
    public void setHocSinhId(Integer hocSinhId) { this.hocSinhId = hocSinhId; }

    public String getHoTenHocSinh() { return hoTenHocSinh; }
    public void setHoTenHocSinh(String hoTenHocSinh) { this.hoTenHocSinh = hoTenHocSinh; }

    public Integer getMonHocId() { return monHocId; }
    public void setMonHocId(Integer monHocId) { this.monHocId = monHocId; }

    public String getTenMonHoc() { return tenMonHoc; }
    public void setTenMonHoc(String tenMonHoc) { this.tenMonHoc = tenMonHoc; }

    public BigDecimal getGiaTriCu() { return giaTriCu; }
    public void setGiaTriCu(BigDecimal giaTriCu) { this.giaTriCu = giaTriCu; }

    public BigDecimal getGiaTriMoi() { return giaTriMoi; }
    public void setGiaTriMoi(BigDecimal giaTriMoi) { this.giaTriMoi = giaTriMoi; }

    public String getHanhDong() { return hanhDong; }
    public void setHanhDong(String hanhDong) { this.hanhDong = hanhDong; }

    public Integer getGiaoVienId() { return giaoVienId; }
    public void setGiaoVienId(Integer giaoVienId) { this.giaoVienId = giaoVienId; }

    public String getHoTenGiaoVien() { return hoTenGiaoVien; }
    public void setHoTenGiaoVien(String hoTenGiaoVien) { this.hoTenGiaoVien = hoTenGiaoVien; }

    public LocalDateTime getThoiGian() { return thoiGian; }
    public void setThoiGian(LocalDateTime thoiGian) { this.thoiGian = thoiGian; }

    public String getLyDo() { return lyDo; }
    public void setLyDo(String lyDo) { this.lyDo = lyDo; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public GiaoVienInfo getGiaoVien() { return giaoVien; }
    public void setGiaoVien(GiaoVienInfo giaoVien) { this.giaoVien = giaoVien; }

    public HocSinhInfo getHocSinh() { return hocSinh; }
    public void setHocSinh(HocSinhInfo hocSinh) { this.hocSinh = hocSinh; }

    public MonHocInfo getMonHoc() { return monHoc; }
    public void setMonHoc(MonHocInfo monHoc) { this.monHoc = monHoc; }

    // Inner classes for nested info
    public static class GiaoVienInfo {
        private Integer id;
        private String hoTen;
        public GiaoVienInfo() {}
        public GiaoVienInfo(Integer id, String hoTen) { this.id = id; this.hoTen = hoTen; }
        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getHoTen() { return hoTen; }
        public void setHoTen(String hoTen) { this.hoTen = hoTen; }
    }

    public static class HocSinhInfo {
        private Integer id;
        private String hoTen;
        public HocSinhInfo() {}
        public HocSinhInfo(Integer id, String hoTen) { this.id = id; this.hoTen = hoTen; }
        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getHoTen() { return hoTen; }
        public void setHoTen(String hoTen) { this.hoTen = hoTen; }
    }

    public static class MonHocInfo {
        private Integer id;
        private String tenMon;
        public MonHocInfo() {}
        public MonHocInfo(Integer id, String tenMon) { this.id = id; this.tenMon = tenMon; }
        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getTenMon() { return tenMon; }
        public void setTenMon(String tenMon) { this.tenMon = tenMon; }
    }
}
