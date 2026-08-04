package com.hethongtruongthpt.dto.donxinnghi;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class DonXinNghiRequest {
    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate ngayBatDau;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate ngayKetThuc;

    private String lyDo;

    private Integer hocSinhId;

    // Getters and Setters
    public Integer getHocSinhId() { return hocSinhId; }
    public void setHocSinhId(Integer hocSinhId) { this.hocSinhId = hocSinhId; }
    public LocalDate getNgayBatDau() { return ngayBatDau; }
    public void setNgayBatDau(LocalDate ngayBatDau) { this.ngayBatDau = ngayBatDau; }

    public LocalDate getNgayKetThuc() { return ngayKetThuc; }
    public void setNgayKetThuc(LocalDate ngayKetThuc) { this.ngayKetThuc = ngayKetThuc; }

    public String getLyDo() { return lyDo; }
    public void setLyDo(String lyDo) { this.lyDo = lyDo; }
}
