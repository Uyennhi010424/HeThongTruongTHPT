package com.hethongtruongthpt.dto.giaovien;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public class GiaoVienNghiRequest {

    @NotNull(message = "Thiếu mã giáo viên")
    @Min(value = 1, message = "Mã giáo viên không hợp lệ")
    private Integer giaoVienId;

    @NotNull(message = "Thiếu ngày nghỉ")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate ngay;

    @Size(max = 20, message = "Năm học tối đa 20 ký tự")
    private String namHoc;

    @Size(max = 500, message = "Lý do tối đa 500 ký tự")
    private String lyDo;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String ghiChu;

    public GiaoVienNghiRequest() {}

    public Integer getGiaoVienId() { return giaoVienId; }
    public void setGiaoVienId(Integer giaoVienId) { this.giaoVienId = giaoVienId; }

    public LocalDate getNgay() { return ngay; }
    public void setNgay(LocalDate ngay) { this.ngay = ngay; }

    public String getNamHoc() { return namHoc; }
    public void setNamHoc(String namHoc) { this.namHoc = namHoc; }

    public String getLyDo() { return lyDo; }
    public void setLyDo(String lyDo) { this.lyDo = lyDo; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }
}
