package com.hethongtruongthpt.dto.baikiemtra;

public class DapAnDTO {
    private Integer id;
    private Integer cauHoiId;
    private String noiDung;
    private Boolean laDapAnDung; // Should be omitted when sent to students

    public DapAnDTO() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getCauHoiId() { return cauHoiId; }
    public void setCauHoiId(Integer cauHoiId) { this.cauHoiId = cauHoiId; }
    public String getNoiDung() { return noiDung; }
    public void setNoiDung(String noiDung) { this.noiDung = noiDung; }
    public Boolean getLaDapAnDung() { return laDapAnDung; }
    public void setLaDapAnDung(Boolean laDapAnDung) { this.laDapAnDung = laDapAnDung; }
}
