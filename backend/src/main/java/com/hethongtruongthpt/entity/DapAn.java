package com.hethongtruongthpt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "dap_an")
public class DapAn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cau_hoi_id", nullable = false)
    private CauHoi cauHoi;

    @Column(name = "noi_dung", columnDefinition = "TEXT", nullable = false)
    private String noiDung;

    @Column(name = "la_dap_an_dung", nullable = false)
    private Boolean laDapAnDung = false;

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public CauHoi getCauHoi() { return cauHoi; }
    public void setCauHoi(CauHoi cauHoi) { this.cauHoi = cauHoi; }
    public String getNoiDung() { return noiDung; }
    public void setNoiDung(String noiDung) { this.noiDung = noiDung; }
    public Boolean getLaDapAnDung() { return laDapAnDung; }
    public void setLaDapAnDung(Boolean laDapAnDung) { this.laDapAnDung = laDapAnDung; }
}
