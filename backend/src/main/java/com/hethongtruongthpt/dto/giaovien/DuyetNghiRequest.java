package com.hethongtruongthpt.dto.giaovien;

import jakarta.validation.constraints.NotNull;

public class DuyetNghiRequest {
    @NotNull(message = "Thiếu trạng thái phê duyệt")
    private String trangThai; // APPROVED, REJECTED

    private String lyDoTuChoi;

    private Integer giaoVienThayId;

    public String getTrangThai() {
        return trangThai;
    }

    public void setTrangThai(String trangThai) {
        this.trangThai = trangThai;
    }

    public String getLyDoTuChoi() {
        return lyDoTuChoi;
    }

    public void setLyDoTuChoi(String lyDoTuChoi) {
        this.lyDoTuChoi = lyDoTuChoi;
    }

    public Integer getGiaoVienThayId() {
        return giaoVienThayId;
    }

    public void setGiaoVienThayId(Integer giaoVienThayId) {
        this.giaoVienThayId = giaoVienThayId;
    }
}
