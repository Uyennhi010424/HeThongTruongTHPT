package com.hethongtruongthpt.dto.lophoc;

public class LopHocDTO {

    private Integer id;
    private String tenLop;
    private Integer khoi;
    private String namHoc;
    private Integer gvcnId;
    private com.hethongtruongthpt.dto.giaovien.GiaoVienDTO gvcn;
    private Integer siSo;
    private String phongHoc;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTenLop() {
        return tenLop;
    }

    public void setTenLop(String tenLop) {
        this.tenLop = tenLop;
    }

    public Integer getKhoi() {
        return khoi;
    }

    public void setKhoi(Integer khoi) {
        this.khoi = khoi;
    }

    public String getNamHoc() {
        return namHoc;
    }

    public void setNamHoc(String namHoc) {
        this.namHoc = namHoc;
    }

    public Integer getGvcnId() {
        return gvcnId;
    }

    public void setGvcnId(Integer gvcnId) {
        this.gvcnId = gvcnId;
    }

    public com.hethongtruongthpt.dto.giaovien.GiaoVienDTO getGvcn() {
        return gvcn;
    }

    public void setGvcn(com.hethongtruongthpt.dto.giaovien.GiaoVienDTO gvcn) {
        this.gvcn = gvcn;
    }

    public Integer getSiSo() {
        return siSo;
    }

    public void setSiSo(Integer siSo) {
        this.siSo = siSo;
    }

    public String getPhongHoc() {
        return phongHoc;
    }

    public void setPhongHoc(String phongHoc) {
        this.phongHoc = phongHoc;
    }
}
