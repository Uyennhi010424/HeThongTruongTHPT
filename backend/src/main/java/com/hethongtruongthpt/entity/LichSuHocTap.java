package com.hethongtruongthpt.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lich_su_hoc_tap")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LichSuHocTap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoc_sinh_id", nullable = false)
    @JsonIgnoreProperties({"lop", "user", "fcmToken", "diemList", "hocBaList", "viPhamList"})
    private HocSinh hocSinh;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lop_id", nullable = false)
    @JsonIgnoreProperties({"gvcn", "toHop", "hocSinhList"})
    private LopHoc lopHoc;

    @Column(name = "nam_hoc", length = 20, nullable = false)
    private String namHoc;

    @Column(name = "ket_qua", length = 50)
    private String ketQua; // Ví dụ: "Lên lớp", "Tốt nghiệp", "Lưu ban"

    @Column(name = "diem_trung_binh", precision = 4, scale = 2)
    private java.math.BigDecimal diemTrungBinh;

    @Column(name = "hoc_luc", length = 20)
    private String hocLuc;

    @Column(name = "hanh_kiem", length = 20)
    private String hanhKiem;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

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

    public LopHoc getLopHoc() {
        return lopHoc;
    }

    public void setLopHoc(LopHoc lopHoc) {
        this.lopHoc = lopHoc;
    }

    public String getNamHoc() {
        return namHoc;
    }

    public void setNamHoc(String namHoc) {
        this.namHoc = namHoc;
    }

    public String getKetQua() {
        return ketQua;
    }

    public void setKetQua(String ketQua) {
        this.ketQua = ketQua;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public java.math.BigDecimal getDiemTrungBinh() {
        return diemTrungBinh;
    }

    public void setDiemTrungBinh(java.math.BigDecimal diemTrungBinh) {
        this.diemTrungBinh = diemTrungBinh;
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
}
