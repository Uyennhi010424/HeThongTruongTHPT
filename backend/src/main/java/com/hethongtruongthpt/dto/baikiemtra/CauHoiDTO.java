package com.hethongtruongthpt.dto.baikiemtra;

import java.util.List;

public class CauHoiDTO {
    private Integer id;
    private Integer baiKiemTraId;
    private String loaiCauHoi; // TRAC_NGHIEM, TU_LUAN
    private String noiDung;
    private Double diem;
    private List<DapAnDTO> dapAns;

    public CauHoiDTO() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getBaiKiemTraId() { return baiKiemTraId; }
    public void setBaiKiemTraId(Integer baiKiemTraId) { this.baiKiemTraId = baiKiemTraId; }
    public String getLoaiCauHoi() { return loaiCauHoi; }
    public void setLoaiCauHoi(String loaiCauHoi) { this.loaiCauHoi = loaiCauHoi; }
    public String getNoiDung() { return noiDung; }
    public void setNoiDung(String noiDung) { this.noiDung = noiDung; }
    public Double getDiem() { return diem; }
    public void setDiem(Double diem) { this.diem = diem; }
    public List<DapAnDTO> getDapAns() { return dapAns; }
    public void setDapAns(List<DapAnDTO> dapAns) { this.dapAns = dapAns; }
}
