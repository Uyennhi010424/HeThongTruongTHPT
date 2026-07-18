package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "giao_vien_ban", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"giao_vien_id", "tuan", "thu", "tiet"})
})
public class GiaoVienBan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "giao_vien_id", nullable = false)
    private GiaoVien giaoVien;

    @Column(name = "tuan", nullable = false)
    private Integer tuan; // 1 -> 36

    @Column(name = "thu", nullable = false)
    private Integer thu; // 2 -> 7

    @Column(name = "tiet", nullable = false)
    private Integer tiet; // 1 -> 10

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public GiaoVien getGiaoVien() { return giaoVien; }
    public void setGiaoVien(GiaoVien giaoVien) { this.giaoVien = giaoVien; }
    public Integer getTuan() { return tuan; }
    public void setTuan(Integer tuan) { this.tuan = tuan; }
    public Integer getThu() { return thu; }
    public void setThu(Integer thu) { this.thu = thu; }
    public Integer getTiet() { return tiet; }
    public void setTiet(Integer tiet) { this.tiet = tiet; }
}
