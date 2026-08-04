package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "cau_hoi")
public class CauHoi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bai_kiem_tra_id", nullable = false)
    private BaiKiemTra baiKiemTra;

    @Column(name = "loai_cau_hoi", nullable = false)
    private String loaiCauHoi; // TRAC_NGHIEM, TU_LUAN

    @Column(name = "noi_dung", columnDefinition = "TEXT", nullable = false)
    private String noiDung;

    @Column(name = "diem", nullable = false)
    private Double diem;

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public BaiKiemTra getBaiKiemTra() { return baiKiemTra; }
    public void setBaiKiemTra(BaiKiemTra baiKiemTra) { this.baiKiemTra = baiKiemTra; }
    public String getLoaiCauHoi() { return loaiCauHoi; }
    public void setLoaiCauHoi(String loaiCauHoi) { this.loaiCauHoi = loaiCauHoi; }
    public String getNoiDung() { return noiDung; }
    public void setNoiDung(String noiDung) { this.noiDung = noiDung; }
    public Double getDiem() { return diem; }
    public void setDiem(Double diem) { this.diem = diem; }
}
