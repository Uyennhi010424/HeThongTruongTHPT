package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "phu_huynh_hoc_sinh", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"phu_huynh_id", "hoc_sinh_id"})
})
public class PhuHuynhHocSinh {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "phu_huynh_id", nullable = false)
    private PhuHuynh phuHuynh;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "hoc_sinh_id", nullable = false)
    private HocSinh hocSinh;

    @Column(name = "quan_he", nullable = false)
    private String quanHe; // CHA, ME, NGUOI_GIAM_HO

    @Column(name = "la_nguoi_lien_he_chinh", nullable = false)
    private Boolean laNguoiLienHeChinh = false;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public PhuHuynh getPhuHuynh() {
        return phuHuynh;
    }

    public void setPhuHuynh(PhuHuynh phuHuynh) {
        this.phuHuynh = phuHuynh;
    }

    public HocSinh getHocSinh() {
        return hocSinh;
    }

    public void setHocSinh(HocSinh hocSinh) {
        this.hocSinh = hocSinh;
    }

    public String getQuanHe() {
        return quanHe;
    }

    public void setQuanHe(String quanHe) {
        this.quanHe = quanHe;
    }

    public Boolean getLaNguoiLienHeChinh() {
        return laNguoiLienHeChinh;
    }

    public void setLaNguoiLienHeChinh(Boolean laNguoiLienHeChinh) {
        this.laNguoiLienHeChinh = laNguoiLienHeChinh;
    }
}
