package com.hethongtruongthpt.entity;

import com.hethongtruongthpt.enums.MucDoViPhamEnum;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "VI_PHAM")
public class ViPham {
    @Id
    @Column(name = "ID_VIPHAM")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "NOI_DUNG", length = 255)
    private String noiDung;

    @Enumerated(EnumType.STRING)
    @Column(name = "MUC_DO")
    private MucDoViPhamEnum mucDo;

    @Column(name = "NGAY_VI_PHAM")
    private LocalDate ngayViPham;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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