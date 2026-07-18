package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "HOC_BA")
public class HocBa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_HOCBA")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ID_HOCSINH", nullable = false)
    private HocSinh hocSinh;

    @ManyToOne
    @JoinColumn(name = "ID_NAMHOC")
    private NamHoc namHoc;

    @Column(name = "HOC_LUC", length = 20)
    private String hocLuc;

    @Column(name = "HANH_KIEM", length = 20)
    private String hanhKiem;

    @Column(name = "DIEM_TB_CA_NAM", precision = 4, scale = 2)
    private java.math.BigDecimal diemTBCaNam;

    @Column(name = "GHI_CHU", length = 255)
    private String ghiChu;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public HocSinh getHocSinh() {
        return hocSinh;
    }

    public void setHocSinh(HocSinh hocSinh) {
        this.hocSinh = hocSinh;
    }

    public NamHoc getNamHoc() {
        return namHoc;
    }

    public void setNamHoc(NamHoc namHoc) {
        this.namHoc = namHoc;
    }

    public String getHocLuc() {
        return hocLuc;
    }

    public void setHocLuc(String hocLuc) {
        this.hocLuc = hocLuc;
    }

    public String getHanhKiem() {
        return hanhKiem;
    }

    public void setHanhKiem(String hanhKiem) {
        this.hanhKiem = hanhKiem;
    }

    public java.math.BigDecimal getDiemTBCaNam() {
        return diemTBCaNam;
    }

    public void setDiemTBCaNam(java.math.BigDecimal diemTBCaNam) {
        this.diemTBCaNam = diemTBCaNam;
    }

    public String getGhiChu() {
        return ghiChu;
    }

    public void setGhiChu(String ghiChu) {
        this.ghiChu = ghiChu;
    }
}
