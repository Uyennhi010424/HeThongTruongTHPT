package com.hethongtruongthpt.dto.thoikhoabieu;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public class TkbDayThayRequest {

    @NotNull(message = "Thiếu mã thời khóa biểu")
    @Min(value = 1, message = "Mã TKB không hợp lệ")
    private Integer tkbId;

    @NotNull(message = "Thiếu mã giáo viên dạy thay")
    @Min(value = 1, message = "Mã giáo viên không hợp lệ")
    private Integer giaoVienThayId;

    @NotNull(message = "Thiếu ngày dạy thay")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate ngay;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String ghiChu;

    public TkbDayThayRequest() {}

    public Integer getTkbId() { return tkbId; }
    public void setTkbId(Integer tkbId) { this.tkbId = tkbId; }

    public Integer getGiaoVienThayId() { return giaoVienThayId; }
    public void setGiaoVienThayId(Integer giaoVienThayId) { this.giaoVienThayId = giaoVienThayId; }

    public LocalDate getNgay() { return ngay; }
    public void setNgay(LocalDate ngay) { this.ngay = ngay; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }
}
