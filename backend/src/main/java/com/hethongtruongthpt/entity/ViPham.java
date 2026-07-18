package com.hethongtruongthpt.entity;

import com.hethongtruongthpt.enums.MucDoViPhamEnum;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "VI_PHAM")
public class ViPham {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_VIPHAM")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ID_HOCSINH", nullable = false)
    private HocSinh hocSinh;

    @Column(name = "NOI_DUNG", length = 255)
    private String noiDung;

    @Enumerated(EnumType.STRING)
    @Column(name = "MUC_DO")
    private MucDoViPhamEnum mucDo;

    @Column(name = "NGAY_VI_PHAM")
    private LocalDate ngayViPham;

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

    public String getNoiDung() {
        return noiDung;
    }

    public void setNoiDung(String noiDung) {
        this.noiDung = noiDung;
    }

    public MucDoViPhamEnum getMucDo() {
        return mucDo;
    }

    public void setMucDo(MucDoViPhamEnum mucDo) {
        this.mucDo = mucDo;
    }

    public LocalDate getNgayViPham() {
        return ngayViPham;
    }

    public void setNgayViPham(LocalDate ngayViPham) {
        this.ngayViPham = ngayViPham;
    }
}
