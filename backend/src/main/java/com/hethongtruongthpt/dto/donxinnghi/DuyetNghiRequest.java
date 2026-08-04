package com.hethongtruongthpt.dto.donxinnghi;

import jakarta.validation.constraints.NotNull;

public class DuyetNghiRequest {
    @NotNull(message = "Trạng thái duyệt không được để trống")
    private String trangThai; // APPROVED or REJECTED

    private String phanHoi;

    public String getTrangThai() { return trangThai; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }

    public String getPhanHoi() { return phanHoi; }
    public void setPhanHoi(String phanHoi) { this.phanHoi = phanHoi; }
}
