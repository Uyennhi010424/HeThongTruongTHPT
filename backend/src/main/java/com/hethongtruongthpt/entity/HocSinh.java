package com.hethongtruongthpt.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "hoc_sinh")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class HocSinh {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Size(max = 20, message = "Mã học sinh tối đa 20 ký tự")
    @Column(name = "ma_hoc_sinh", length = 20, nullable = false, unique = true)
    private String maHocSinh;

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
    @Column(name = "ho_ten", length = 100, nullable = false)
    private String hoTen;

    @NotNull(message = "Ngày sinh không được để trống")
    @Column(name = "ngay_sinh", nullable = false)
    private LocalDate ngaySinh;

    @NotBlank(message = "Giới tính không được để trống")
    @Column(name = "gioi_tinh", nullable = false)
    private String gioiTinh; // NAM or NU

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "lop_id")
    private LopHoc lop;

    @Column(name = "dia_chi")
    private String diaChi;

    @NotNull(message = "Năm nhập học không được để trống")
    @Min(value = 2000, message = "Năm nhập học phải từ năm 2000 trở đi")
    @Column(name = "nam_nhap_hoc", nullable = false)
    private Integer namNhapHoc;

    @Pattern(regexp = "^(0[0-9]{9})?$", message = "Số điện thoại không hợp lệ (phải có 10 chữ số bắt đầu bằng 0)")
    @Column(name = "sdt", length = 20)
    private String sdt;

    @Email(message = "Email không hợp lệ")
    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "dan_toc")
    private String danToc;

    @Column(name = "ton_giao")
    private String tonGiao;

    @Column(name = "ma_bhyt", length = 50)
    private String maBhyt;

    @Column(name = "dien_chinh_sach")
    private Boolean dienChinhSach = false;

    @Column(name = "trang_thai")
    private Integer trangThai = 1;

    @Column(name = "truong_chuyen_den", length = 200)
    private String truongChuyenDen;

    @Transient
    private Integer phuHuynhId; // populated at service layer when available

    @Column(name = "anh_dai_dien", columnDefinition = "TEXT")
    private String anhDaiDien;

    @JsonIgnore
    @Column(name = "fcm_token", length = 500)
    private String fcmToken;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PostLoad
    private void normalizeText() {
        if (hoTen != null) hoTen = java.text.Normalizer.normalize(hoTen.strip(), java.text.Normalizer.Form.NFC);
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getMaHocSinh() {
        return maHocSinh;
    }

    public void setMaHocSinh(String maHocSinh) {
        this.maHocSinh = maHocSinh;
    }

    public String getHoTen() {
        return hoTen;
    }

    public void setHoTen(String hoTen) {
        this.hoTen = hoTen;
    }

    public LocalDate getNgaySinh() {
        return ngaySinh;
    }

    public void setNgaySinh(LocalDate ngaySinh) {
        this.ngaySinh = ngaySinh;
    }

    public String getGioiTinh() {
        return gioiTinh;
    }

    public void setGioiTinh(String gioiTinh) {
        this.gioiTinh = gioiTinh;
    }

    public LopHoc getLop() {
        return lop;
    }

    public void setLop(LopHoc lop) {
        this.lop = lop;
    }

    public String getDiaChi() {
        return diaChi;
    }

    public void setDiaChi(String diaChi) {
        this.diaChi = diaChi;
    }

    public Integer getNamNhapHoc() {
        return namNhapHoc;
    }

    public void setNamNhapHoc(Integer namNhapHoc) {
        this.namNhapHoc = namNhapHoc;
    }

    public String getAnhDaiDien() {
        return anhDaiDien;
    }

    public void setAnhDaiDien(String anhDaiDien) {
        this.anhDaiDien = anhDaiDien;
    }

    public String getSdt() {
        return sdt;
    }

    public void setSdt(String sdt) {
        this.sdt = sdt;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDanToc() {
        return danToc;
    }

    public void setDanToc(String danToc) {
        this.danToc = danToc;
    }

    public String getTonGiao() {
        return tonGiao;
    }

    public void setTonGiao(String tonGiao) {
        this.tonGiao = tonGiao;
    }

    public String getMaBhyt() {
        return maBhyt;
    }

    public void setMaBhyt(String maBhyt) {
        this.maBhyt = maBhyt;
    }

    public Boolean getDienChinhSach() {
        return dienChinhSach;
    }

    public void setDienChinhSach(Boolean dienChinhSach) {
        this.dienChinhSach = dienChinhSach;
    }

    public Integer getTrangThai() {
        return trangThai;
    }

    public void setTrangThai(Integer trangThai) {
        this.trangThai = trangThai;
    }

    public Integer getPhuHuynhId() {
        return phuHuynhId;
    }

    public void setPhuHuynhId(Integer phuHuynhId) {
        this.phuHuynhId = phuHuynhId;
    }

    public String getFcmToken() {
        return fcmToken;
    }

    public void setFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getTruongChuyenDen() {
        return truongChuyenDen;
    }

    public void setTruongChuyenDen(String truongChuyenDen) {
        this.truongChuyenDen = truongChuyenDen;
    }
}