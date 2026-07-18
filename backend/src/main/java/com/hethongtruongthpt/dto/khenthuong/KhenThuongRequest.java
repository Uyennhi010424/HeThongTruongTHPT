package com.hethongtruongthpt.dto.khenthuong;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class KhenThuongRequest {

    @NotNull(message = "ID học sinh không được để trống")
    private Integer hocSinhId;

    @NotBlank(message = "Nội dung không được để trống")
    @Size(max = 255, message = "Nội dung không được vượt quá 255 ký tự")
    private String noiDung;

    @NotNull(message = "Ngày khen không được để trống")
    private LocalDate ngayKhen;

    public KhenThuongRequest() {
    }

    public KhenThuongRequest(Integer hocSinhId, String noiDung, LocalDate ngayKhen) {
        this.hocSinhId = hocSinhId;
        this.noiDung = noiDung;
        this.ngayKhen = ngayKhen;
    }

    public Integer getHocSinhId() {
        return hocSinhId;
    }

    public void setHocSinhId(Integer hocSinhId) {
        this.hocSinhId = hocSinhId;
    }

    public String getNoiDung() {
        return noiDung;
    }

    public void setNoiDung(String noiDung) {
        this.noiDung = noiDung;
    }

    public LocalDate getNgayKhen() {
        return ngayKhen;
    }

    public void setNgayKhen(LocalDate ngayKhen) {
        this.ngayKhen = ngayKhen;
    }
}
