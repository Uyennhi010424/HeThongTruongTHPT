package com.hethongtruongthpt.dto.baikiemtra;

public class ChiTietBaiLamDTO {
    private Integer id;
    private Integer baiLamId;
    private Integer cauHoiId;
    private Integer dapAnId; // For TRAC_NGHIEM
    private String cauTraLoiTuLuan; // For TU_LUAN
    private Double diemDatDuoc;
    
    // Extra fields to return back to teacher when grading
    private String noiDungCauHoi;
    private String loaiCauHoi;
    private Double diemToiDa;
    
    private String dapAnDaChon;
    private String dapAnDung;
    
    public ChiTietBaiLamDTO() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getBaiLamId() { return baiLamId; }
    public void setBaiLamId(Integer baiLamId) { this.baiLamId = baiLamId; }
    public Integer getCauHoiId() { return cauHoiId; }
    public void setCauHoiId(Integer cauHoiId) { this.cauHoiId = cauHoiId; }
    public Integer getDapAnId() { return dapAnId; }
    public void setDapAnId(Integer dapAnId) { this.dapAnId = dapAnId; }
    public String getCauTraLoiTuLuan() { return cauTraLoiTuLuan; }
    public void setCauTraLoiTuLuan(String cauTraLoiTuLuan) { this.cauTraLoiTuLuan = cauTraLoiTuLuan; }
    public Double getDiemDatDuoc() { return diemDatDuoc; }
    public void setDiemDatDuoc(Double diemDatDuoc) { this.diemDatDuoc = diemDatDuoc; }
    public String getNoiDungCauHoi() { return noiDungCauHoi; }
    public void setNoiDungCauHoi(String noiDungCauHoi) { this.noiDungCauHoi = noiDungCauHoi; }
    public String getLoaiCauHoi() { return loaiCauHoi; }
    public void setLoaiCauHoi(String loaiCauHoi) { this.loaiCauHoi = loaiCauHoi; }
    public Double getDiemToiDa() { return diemToiDa; }
    public void setDiemToiDa(Double diemToiDa) { this.diemToiDa = diemToiDa; }
    public String getDapAnDaChon() { return dapAnDaChon; }
    public void setDapAnDaChon(String dapAnDaChon) { this.dapAnDaChon = dapAnDaChon; }
    public String getDapAnDung() { return dapAnDung; }
    public void setDapAnDung(String dapAnDung) { this.dapAnDung = dapAnDung; }
}
