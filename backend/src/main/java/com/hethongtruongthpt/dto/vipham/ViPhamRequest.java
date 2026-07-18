package com.hethongtruongthpt.dto.vipham;

import com.hethongtruongthpt.enums.MucDoViPhamEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class ViPhamRequest {

    @NotNull(message = "ID học sinh không được để trống")
    private Integer hocSinhId;

    @NotBlank(message = "Nội dung không được để trống")
    @Size(max = 255, message = "Nội dung không được vượt quá 255 ký tự")
    private String noiDung;

    @NotNull(message = "Mức độ vi phạm không được để trống")
    private MucDoViPhamEnum mucDo;

    @NotNull(message = "Ngày vi phạm không được để trống")
    private LocalDate ngayViPham;

    public ViPhamRequest() {
    }

    public ViPhamRequest(Integer hocSinhId, String noiDung, MucDoViPhamEnum mucDo, LocalDate ngayViPham) {
        this.hocSinhId = hocSinhId;
        this.noiDung = noiDung;
        this.mucDo = mucDo;
        this.ngayViPham = ngayViPham;
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

    public MucDoViPhamEnum getMucDo() {
        return mucDo;
    }

    public void setMucDo(MucDoViPhamEnum mucDo) {
        this.mucDo = mucDo;
    }

    public LocalDate getNgayViPham() {
        return ngayViPham;
    }

    public void setNgayViPham(LocalDate ngayViPham) {
        this.ngayViPham = ngayViPham;
    }
}
