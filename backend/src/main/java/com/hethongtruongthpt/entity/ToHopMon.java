package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "to_hop_mon")
public class ToHopMon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @NotBlank(message = "Mã tổ hợp không được để trống")
    @Size(max = 10, message = "Mã tổ hợp tối đa 10 ký tự")
    @Column(name = "ma_to_hop", length = 10, nullable = false, unique = true)
    private String maToHop;

    @NotBlank(message = "Tên tổ hợp không được để trống")
    @Size(max = 100, message = "Tên tổ hợp tối đa 100 ký tự")
    @Column(name = "ten_to_hop", length = 100, nullable = false)
    private String tenToHop;

    @NotBlank(message = "Ban không được để trống")
    @Size(max = 50, message = "Ban tối đa 50 ký tự")
    @Column(name = "ban", length = 50, nullable = false)
    private String ban;

    @Column(name = "mo_ta")
    private String moTa;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

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
}
