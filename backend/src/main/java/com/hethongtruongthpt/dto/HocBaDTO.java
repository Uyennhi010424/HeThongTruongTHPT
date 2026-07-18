package com.hethongtruongthpt.dto;

import java.util.List;

public class HocBaDTO {
    private Integer id;
    private Integer hocSinhId;
    private String hoTenHocSinh;
    private String tenLop;
    private Integer namHocId;
    private String tenNamHoc;
    private String hocLuc;
    private String hanhKiem;
    private String ghiChu;
    private Double diemTBCaNam;
    private List<MonDiemDTO> diemTungMon;

    public static class MonDiemDTO {
        private Integer monHocId;
        private String tenMonHoc;
        private Double diemTBHK1;
        private Double diemTBHK2;
        private Double diemTBCaNam;
        private String xepLoai; // vi phạm điều kiện hay không

        public Integer getMonHocId() { return monHocId; }
        public void setMonHocId(Integer monHocId) { this.monHocId = monHocId; }
        public String getTenMonHoc() { return tenMonHoc; }
        public void setTenMonHoc(String tenMonHoc) { this.tenMonHoc = tenMonHoc; }
        public Double getDiemTBHK1() { return diemTBHK1; }
        public void setDiemTBHK1(Double diemTBHK1) { this.diemTBHK1 = diemTBHK1; }
        public Double getDiemTBHK2() { return diemTBHK2; }
        public void setDiemTBHK2(Double diemTBHK2) { this.diemTBHK2 = diemTBHK2; }
        public Double getDiemTBCaNam() { return diemTBCaNam; }
        public void setDiemTBCaNam(Double diemTBCaNam) { this.diemTBCaNam = diemTBCaNam; }
        public String getXepLoai() { return xepLoai; }
        public void setXepLoai(String xepLoai) { this.xepLoai = xepLoai; }
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getHocSinhId() { return hocSinhId; }
    public void setHocSinhId(Integer hocSinhId) { this.hocSinhId = hocSinhId; }
    public String getHoTenHocSinh() { return hoTenHocSinh; }
    public void setHoTenHocSinh(String hoTenHocSinh) { this.hoTenHocSinh = hoTenHocSinh; }
    public String getTenLop() { return tenLop; }
    public void setTenLop(String tenLop) { this.tenLop = tenLop; }
    public Integer getNamHocId() { return namHocId; }
    public void setNamHocId(Integer namHocId) { this.namHocId = namHocId; }
    public String getTenNamHoc() { return tenNamHoc; }
    public void setTenNamHoc(String tenNamHoc) { this.tenNamHoc = tenNamHoc; }
    public String getHocLuc() { return hocLuc; }
    public void setHocLuc(String hocLuc) { this.hocLuc = hocLuc; }
    public String getHanhKiem() { return hanhKiem; }
    public void setHanhKiem(String hanhKiem) { this.hanhKiem = hanhKiem; }
    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }
    public Double getDiemTBCaNam() { return diemTBCaNam; }
    public void setDiemTBCaNam(Double diemTBCaNam) { this.diemTBCaNam = diemTBCaNam; }
    public List<MonDiemDTO> getDiemTungMon() { return diemTungMon; }
    public void setDiemTungMon(List<MonDiemDTO> diemTungMon) { this.diemTungMon = diemTungMon; }
}
