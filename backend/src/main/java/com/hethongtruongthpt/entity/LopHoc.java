package com.hethongtruongthpt.entity;

import jakarta.persistence.*;


@Entity
@Table(name = "LOP")
public class LopHoc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_LOP")
    private Long id;

    @Column(name = "TEN_LOP", length = 20)
    private String tenLop;

    @Column(name = "KHOI", length = 10)
    private String khoi;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTenLop() {
        return tenLop;
    }

    public void setTenLop(String tenLop) {
        this.tenLop = tenLop;
    }

    public String getKhoi() {
        return khoi;
    }

    public void setKhoi(String khoi) {
        this.khoi = khoi;
    }

}