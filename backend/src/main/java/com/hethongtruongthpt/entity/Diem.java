package com.hethongtruongthpt.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "diem", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"hoc_sinh_id", "mon_hoc_id", "loai_diem", "so_thu_tu", "hoc_ky", "nam_hoc"})
}, indexes = {
    @Index(name = "idx_diem_nam_hoc", columnList = "nam_hoc")
})
public class Diem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "hoc_sinh_id", nullable = false)
    private HocSinh hocSinh;

    @ManyToOne
    @JoinColumn(name = "mon_hoc_id", nullable = false)
    private MonHoc monHoc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phan_cong_day_id", nullable = false)
    @JsonIgnore
    private PhanCongDay phanCongDay;

    @NotBlank(message = "Loại điểm không được để trống")
    @Column(name = "loai_diem", nullable = false)
    private String loaiDiem; // TX, GK, CK

    @NotNull(message = "Số thứ tự không được để trống")
    @Column(name = "so_thu_tu", nullable = false)
    private Integer soThuTu = 0; // TX1/TX2/TX3/TX4; dùng 0 cho GK và CK

    @NotNull(message = "Học kỳ không được để trống")
    @Min(value = 1, message = "Học kỳ phải là 1 hoặc 2")
    @Max(value = 2, message = "Học kỳ phải là 1 hoặc 2")
    @Column(name = "hoc_ky", nullable = false)
    private Integer hocKy;

    @NotBlank(message = "Năm học không được để trống")
    @Size(min = 9, max = 9, message = "Năm học phải có định dạng YYYY-YYYY")
    @Column(name = "nam_hoc", length = 9, nullable = false)
    private String namHoc;

    @DecimalMin(value = "0.0", message = "Điểm phải >= 0")
    @DecimalMax(value = "10.0", message = "Điểm phải <= 10")
    @Column(name = "gia_tri", precision = 4, scale = 1)
    private BigDecimal giaTriDiem;

    @Column(name = "nhan_xet")
    private String nhanXet; // DAT or CHUA_DAT

    @Column(name = "status", nullable = false)
    private String status = "DRAFT"; // DRAFT, CONFIRMED, LOCKED

    @Column(name = "ngay_nhap", nullable = false, updatable = false)
    private LocalDateTime ngayNhap;

    @ManyToOne
    @JoinColumn(name = "giao_vien_nhap_id", nullable = false)
    private GiaoVien giaoVienNhap;

    @Column(name = "ghi_chu")
    private String ghiChu;

    @PrePersist
    public void prePersist() {
        this.ngayNhap = LocalDateTime.now();
        if (this.status == null) {
            this.status = "DRAFT";
        }
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

    public MonHoc getMonHoc() {
        return monHoc;
    }

    public void setMonHoc(MonHoc monHoc) {
        this.monHoc = monHoc;
    }

    public PhanCongDay getPhanCongDay() {
        return phanCongDay;
    }

    public void setPhanCongDay(PhanCongDay phanCongDay) {
        this.phanCongDay = phanCongDay;
    }

    public String getLoaiDiem() {
        return loaiDiem;
    }

    public void setLoaiDiem(String loaiDiem) {
        this.loaiDiem = loaiDiem;
    }

    public Integer getSoThuTu() {
        return soThuTu;
    }

    public void setSoThuTu(Integer soThuTu) {
        this.soThuTu = soThuTu;
    }

    public Integer getHocKy() {
        return hocKy;
    }

    public void setHocKy(Integer hocKy) {
        this.hocKy = hocKy;
    }

    public String getNamHoc() {
        return namHoc;
    }

    public void setNamHoc(String namHoc) {
        this.namHoc = namHoc;
    }

    public BigDecimal getGiaTriDiem() {
        return giaTriDiem;
    }

    public void setGiaTriDiem(BigDecimal giaTriDiem) {
        this.giaTriDiem = giaTriDiem;
    }

    public String getNhanXet() {
        return nhanXet;
    }

    public void setNhanXet(String nhanXet) {
        this.nhanXet = nhanXet;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getNgayNhap() {
        return ngayNhap;
    }

    public void setNgayNhap(LocalDateTime ngayNhap) {
        this.ngayNhap = ngayNhap;
    }

    public GiaoVien getGiaoVienNhap() {
        return giaoVienNhap;
    }

    public void setGiaoVienNhap(GiaoVien giaoVienNhap) {
        this.giaoVienNhap = giaoVienNhap;
    }

    public String getGhiChu() {
        return ghiChu;
    }

    public void setGhiChu(String ghiChu) {
        this.ghiChu = ghiChu;
    }
}