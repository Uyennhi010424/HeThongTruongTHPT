package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "mon_hoc")
public class MonHoc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @NotBlank(message = "Tên môn không được để trống")
    @Size(max = 100, message = "Tên môn tối đa 100 ký tự")
    @Column(name = "ten_mon", length = 100, nullable = false, unique = true)
    private String tenMon;

    @Size(max = 20, message = "Mã môn tối đa 20 ký tự")
    @Column(name = "ma_mon", length = 20, nullable = false, unique = true)
    private String maMon;

    @NotBlank(message = "Nhóm đánh giá không được để trống")
    @Column(name = "nhom_danh_gia", nullable = false)
    private String nhomDanhGia;

    @NotNull(message = "Số ĐTX mỗi học kỳ không được để trống")
    @Min(value = 0, message = "Số ĐTX phải >= 0")
    @Column(name = "so_dtx_hoc_ky", nullable = false)
    private Integer soDtxHocKy;

    @NotBlank(message = "Khối áp dụng không được để trống")
    @Size(max = 20, message = "Khối áp dụng tối đa 20 ký tự")
    @Column(name = "khoi_ap_dung", length = 20, nullable = false)
    private String khoiApDung;

    @Column(name = "mo_ta")
    private String moTa;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_deleted", columnDefinition = "boolean default false")
    private Boolean isDeleted = false;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getTenMon() { return tenMon; }
    public void setTenMon(String tenMon) { this.tenMon = tenMon; }
    public String getMaMon() { return maMon; }
    public void setMaMon(String maMon) { this.maMon = maMon; }
    public String getNhomDanhGia() { return nhomDanhGia; }
    public void setNhomDanhGia(String nhomDanhGia) { this.nhomDanhGia = nhomDanhGia; }
    public Integer getSoDtxHocKy() { return soDtxHocKy; }
    public void setSoDtxHocKy(Integer soDtxHocKy) { this.soDtxHocKy = soDtxHocKy; }
    public String getKhoiApDung() { return khoiApDung; }
    public void setKhoiApDung(String khoiApDung) { this.khoiApDung = khoiApDung; }
    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }
}
