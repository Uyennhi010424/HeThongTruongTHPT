package com.hethongtruongthpt.entity;

import com.hethongtruongthpt.enums.LoaiDiemEnum;
import jakarta.persistence.*;


@Entity
@Table(name = "DIEM")
public class Diem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_DIEM")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "LOAI_DIEM", length = 20)
    private LoaiDiemEnum loaiDiem;

    @Column(name = "DIEM_SO")
    private Double diemSo;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LoaiDiemEnum getLoaiDiem() {
        return loaiDiem;
    }

    public void setLoaiDiem(LoaiDiemEnum loaiDiem) {
        this.loaiDiem = loaiDiem;
    }

    public Double getDiemSo() {
        return diemSo;
    }

    public void setDiemSo(Double diemSo) {
        this.diemSo = diemSo;
    }
}