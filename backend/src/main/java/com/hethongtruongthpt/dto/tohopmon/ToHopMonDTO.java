package com.hethongtruongthpt.dto.tohopmon;

import java.util.List;

public class ToHopMonDTO {
    private Integer id;
    private String maToHop;
    private String tenToHop;
    private String ban;
    private String moTa;
    private Boolean isActive;
    private List<Integer> monHocIds;
    private List<String> tenMonHocs;
    private List<Integer> soTiets;
    private Integer soLopSuDung;
    private List<String> danhSachLop;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getMaToHop() { return maToHop; }
    public void setMaToHop(String maToHop) { this.maToHop = maToHop; }
    public String getTenToHop() { return tenToHop; }
    public void setTenToHop(String tenToHop) { this.tenToHop = tenToHop; }
    public String getBan() { return ban; }
    public void setBan(String ban) { this.ban = ban; }
    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public List<Integer> getMonHocIds() { return monHocIds; }
    public void setMonHocIds(List<Integer> monHocIds) { this.monHocIds = monHocIds; }
    public List<String> getTenMonHocs() { return tenMonHocs; }
    public void setTenMonHocs(List<String> tenMonHocs) { this.tenMonHocs = tenMonHocs; }
    public Integer getSoLopSuDung() { return soLopSuDung; }
    public void setSoLopSuDung(Integer soLopSuDung) { this.soLopSuDung = soLopSuDung; }
    public List<Integer> getSoTiets() { return soTiets; }
    public void setSoTiets(List<Integer> soTiets) { this.soTiets = soTiets; }
    public List<String> getDanhSachLop() { return danhSachLop; }
    public void setDanhSachLop(List<String> danhSachLop) { this.danhSachLop = danhSachLop; }
}
