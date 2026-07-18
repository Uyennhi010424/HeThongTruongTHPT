package com.hethongtruongthpt.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "lop", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"ten_lop", "nam_hoc"})
})
public class LopHoc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @NotBlank(message = "Tên lớp không được để trống")
    @Size(max = 20, message = "Tên lớp tối đa 20 ký tự")
    @Column(name = "ten_lop", length = 20, nullable = false)
    private String tenLop;

    @NotNull(message = "Khối không được để trống")
    @Min(value = 10, message = "Khối phải là 10, 11 hoặc 12")
    @Max(value = 12, message = "Khối phải là 10, 11 hoặc 12")
    @Column(name = "khoi", nullable = false)
    private Integer khoi;

    @NotBlank(message = "Năm học không được để trống")
    @Size(min = 9, max = 9, message = "Năm học phải có định dạng YYYY-YYYY")
    @Column(name = "nam_hoc", length = 9, nullable = false)
    private String namHoc;

    @ManyToOne
    @JoinColumn(name = "gvcn_id")
    private GiaoVien gvcn; // Giáo viên chủ nhiệm

    @Column(name = "to_hop_id")
    private Integer toHopId; // Tổ hợp môn tự chọn (ID)

    @Column(name = "si_so", nullable = false)
    private Integer siSo = 0;

    @PostLoad
    private void normalizeText() {
        if (tenLop != null) tenLop = java.text.Normalizer.normalize(tenLop.strip(), java.text.Normalizer.Form.NFC);
        if (phongHoc != null) phongHoc = java.text.Normalizer.normalize(phongHoc.strip(), java.text.Normalizer.Form.NFC);
    }

    @Column(name = "phong_hoc", length = 10)
    private String phongHoc;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTenLop() {
        return tenLop;
    }

    public void setTenLop(String tenLop) {
        this.tenLop = tenLop;
    }

    public Integer getKhoi() {
        return khoi;
    }

    public void setKhoi(Integer khoi) {
        this.khoi = khoi;
    }

    public String getNamHoc() {
        return namHoc;
    }

    public void setNamHoc(String namHoc) {
        this.namHoc = namHoc;
    }

    public GiaoVien getGvcn() {
        return gvcn;
    }

    public void setGvcn(GiaoVien gvcn) {
        this.gvcn = gvcn;
    }

    public Integer getSiSo() {
        return siSo;
    }

    public void setSiSo(Integer siSo) {
        this.siSo = siSo;
    }

    public String getPhongHoc() {
        return phongHoc;
    }

    public void setPhongHoc(String phongHoc) {
        this.phongHoc = phongHoc;
    }

    public Integer getToHopId() {
        return toHopId;
    }

    public void setToHopId(Integer toHopId) {
        this.toHopId = toHopId;
    }
}