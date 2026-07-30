package com.hethongtruongthpt.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "diem", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"hoc_sinh_id", "mon_hoc_id", "loai_diem", "so_thu_tu", "hoc_ky", "nam_hoc"})
}, indexes = {
    @Index(name = "idx_diem_hs_nam_hk", columnList = "hoc_sinh_id, nam_hoc, hoc_ky"),
    @Index(name = "idx_diem_gv_nam_hk", columnList = "giao_vien_nhap_id, nam_hoc, hoc_ky")
})
public class Diem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "hoc_sinh_id", nullable = false)
    private HocSinh hocSinh;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "mon_hoc_id", nullable = false)
    private MonHoc monHoc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phan_cong_day_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
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

    @CreatedDate
    @Column(name = "ngay_nhap", nullable = false, updatable = false)
    private LocalDateTime ngayNhap;

    @LastModifiedDate
    @Column(name = "ngay_sua")
    private LocalDateTime ngaySua;

    @CreatedBy
    @Column(name = "nguoi_nhap")
    private String nguoiNhap;

    @LastModifiedBy
    @Column(name = "nguoi_sua")
    private String nguoiSua;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "giao_vien_nhap_id", nullable = false)
    private GiaoVien giaoVienNhap;

    @Column(name = "ghi_chu")
    private String ghiChu;

    @Version
    @Column(name = "version", nullable = false, columnDefinition = "bigint default 0")
    private long version;

    @PrePersist
    public void prePersist() {
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

    public long getVersion() {
        return version;
    }

    public void setVersion(long version) {
        this.version = version;
    }

    public LocalDateTime getNgaySua() {
        return ngaySua;
    }

    public void setNgaySua(LocalDateTime ngaySua) {
        this.ngaySua = ngaySua;
    }

    public String getNguoiNhap() {
        return nguoiNhap;
    }

    public void setNguoiNhap(String nguoiNhap) {
        this.nguoiNhap = nguoiNhap;
    }

    public String getNguoiSua() {
        return nguoiSua;
    }

    public void setNguoiSua(String nguoiSua) {
        this.nguoiSua = nguoiSua;
    }
}