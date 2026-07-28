package com.hethongtruongthpt.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "thong_bao")
public class ThongBao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
    @Column(name = "tieu_de", length = 255, nullable = false)
    private String tieuDe;

    @NotBlank(message = "Nội dung không được để trống")
    @Column(name = "noi_dung", nullable = false, columnDefinition = "TEXT")
    private String noiDung;

    @NotBlank(message = "Loại thông báo không được để trống")
    @Column(name = "loai", nullable = false)
    @JsonProperty("doiTuong")
    private String loai; // ALL, HOC_SINH, GIAO_VIEN, PHU_HUYNH

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "lop_id")
    private LopHoc lop;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "hoc_sinh_id")
    private HocSinh hocSinh;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "nguoi_tao_id", nullable = false)
    private User nguoiTao;

    @Column(name = "ngay_dang", nullable = false)
    private LocalDateTime ngayDang;

    @Column(name = "han_hien_thi")
    private LocalDateTime hanHienThi;

    @Column(name = "trang_thai")
    private Integer trangThai = 1; // 1 = hiển thị, 0 = ẩn

    // ─── Reply/Thread support ───
    /** ID thông báo cha (null = thông báo gốc, non-null = phản hồi) */
    @Column(name = "parent_id")
    private Integer parentId;

    /** Role người gửi: ADMIN, GIAO_VIEN, HOC_SINH, PHU_HUYNH */
    @Column(name = "sender_role", length = 20)
    private String senderRole;

    /**
     * ID người nhận cụ thể (userId) khi gửi riêng cho 1 người.
     * Null = gửi theo loai (broadcast theo role/lớp).
     */
    @Column(name = "recipient_id")
    private Integer recipientId;

    /**
     * Đánh dấu đây là phản hồi (reply) hay thông báo gốc.
     * true = reply, false/null = thông báo gốc.
     */
    @Column(name = "is_reply")
    private Boolean isReply = false;

    @PrePersist
    public void prePersist() {
        this.ngayDang = LocalDateTime.now();
        if (this.isReply == null) this.isReply = false;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTieuDe() {
        return tieuDe;
    }

    public void setTieuDe(String tieuDe) {
        this.tieuDe = tieuDe;
    }

    public String getNoiDung() {
        return noiDung;
    }

    public void setNoiDung(String noiDung) {
        this.noiDung = noiDung;
    }

    public String getLoai() {
        return loai;
    }

    public void setLoai(String loai) {
        this.loai = loai;
    }

    public LopHoc getLop() {
        return lop;
    }

    public void setLop(LopHoc lop) {
        this.lop = lop;
    }

    public HocSinh getHocSinh() {
        return hocSinh;
    }

    public void setHocSinh(HocSinh hocSinh) {
        this.hocSinh = hocSinh;
    }

    public User getNguoiTao() {
        return nguoiTao;
    }

    public void setNguoiTao(User nguoiTao) {
        this.nguoiTao = nguoiTao;
    }

    public LocalDateTime getNgayDang() {
        return ngayDang;
    }

    public void setNgayDang(LocalDateTime ngayDang) {
        this.ngayDang = ngayDang;
    }

    public LocalDateTime getHanHienThi() {
        return hanHienThi;
    }

    public void setHanHienThi(LocalDateTime hanHienThi) {
        this.hanHienThi = hanHienThi;
    }

    public Integer getTrangThai() {
        return trangThai;
    }

    public void setTrangThai(Integer trangThai) {
        this.trangThai = trangThai;
    }

    public Integer getParentId() {
        return parentId;
    }

    public void setParentId(Integer parentId) {
        this.parentId = parentId;
    }

    public String getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
    }

    public Integer getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Integer recipientId) {
        this.recipientId = recipientId;
    }

    public Boolean getIsReply() {
        return isReply;
    }

    public void setIsReply(Boolean isReply) {
        this.isReply = isReply;
    }
}