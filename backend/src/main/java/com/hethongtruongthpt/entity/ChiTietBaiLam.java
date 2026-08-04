package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "chi_tiet_bai_lam")
public class ChiTietBaiLam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bai_lam_id", nullable = false)
    private BaiLam baiLam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cau_hoi_id", nullable = false)
    private CauHoi cauHoi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dap_an_id") // Can be null if it's an essay question
    private DapAn dapAn;

    @Column(name = "cau_tra_loi_tu_luan", columnDefinition = "TEXT")
    private String cauTraLoiTuLuan;

    @Column(name = "diem_dat_duoc")
    private Double diemDatDuoc = 0.0; // Auto-calculated for multiple choice, graded by teacher for essay

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public BaiLam getBaiLam() { return baiLam; }
    public void setBaiLam(BaiLam baiLam) { this.baiLam = baiLam; }
    public CauHoi getCauHoi() { return cauHoi; }
    public void setCauHoi(CauHoi cauHoi) { this.cauHoi = cauHoi; }
    public DapAn getDapAn() { return dapAn; }
    public void setDapAn(DapAn dapAn) { this.dapAn = dapAn; }
    public String getCauTraLoiTuLuan() { return cauTraLoiTuLuan; }
    public void setCauTraLoiTuLuan(String cauTraLoiTuLuan) { this.cauTraLoiTuLuan = cauTraLoiTuLuan; }
    public Double getDiemDatDuoc() { return diemDatDuoc; }
    public void setDiemDatDuoc(Double diemDatDuoc) { this.diemDatDuoc = diemDatDuoc; }
}
