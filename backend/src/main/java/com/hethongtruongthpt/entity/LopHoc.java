package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "lop", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"ten_lop", "nam_hoc"})
})
public class LopHoc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "ten_lop", length = 20, nullable = false)
    private String tenLop;

    @Column(name = "khoi", nullable = false)
    private Integer khoi;

    @Column(name = "nam_hoc", length = 9, nullable = false)
    private String namHoc;

    @ManyToOne
    @JoinColumn(name = "gvcn_id")
    private GiaoVien gvcn; // Giáo viên chủ nhiệm

    @Column(name = "si_so", nullable = false)
    private Integer siSo = 0;

    @Column(name = "phong_hoc", length = 10)
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

    public GiaoVien getGvcn() {
        return gvcn;
    }

    public void setGvcn(GiaoVien gvcn) {
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