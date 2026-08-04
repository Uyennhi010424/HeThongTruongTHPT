package com.hethongtruongthpt.dto;

public class AutoGenerateExamRequest {
    private String namHoc;
    private Integer hocKy;
    private Integer tuan;
    private String loaiKiemTra; // "GK" or "CK"

    public String getNamHoc() { return namHoc; }
    public void setNamHoc(String namHoc) { this.namHoc = namHoc; }
    
    public Integer getHocKy() { return hocKy; }
    public void setHocKy(Integer hocKy) { this.hocKy = hocKy; }
    
    public Integer getTuan() { return tuan; }
    public void setTuan(Integer tuan) { this.tuan = tuan; }
    
    public String getLoaiKiemTra() { return loaiKiemTra; }
    public void setLoaiKiemTra(String loaiKiemTra) { this.loaiKiemTra = loaiKiemTra; }
}
