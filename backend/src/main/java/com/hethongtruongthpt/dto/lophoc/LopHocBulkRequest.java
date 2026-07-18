package com.hethongtruongthpt.dto.lophoc;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class LopHocBulkRequest {

    @NotBlank(message = "Thiếu năm học")
    @Pattern(regexp = "^\\d{4}-\\d{4}$", message = "Năm học phải có định dạng YYYY-YYYY")
    @Size(max = 20, message = "Năm học tối đa 20 ký tự")
    private String namHoc;

    @Min(value = 0, message = "Số lớp 10 phải >= 0")
    private int soLop10 = 0;

    @Min(value = 0, message = "Số lớp 11 phải >= 0")
    private int soLop11 = 0;

    @Min(value = 0, message = "Số lớp 12 phải >= 0")
    private int soLop12 = 0;

    public LopHocBulkRequest() {}

    public String getNamHoc() { return namHoc; }
    public void setNamHoc(String namHoc) { this.namHoc = namHoc; }

    public int getSoLop10() { return soLop10; }
    public void setSoLop10(int soLop10) { this.soLop10 = soLop10; }

    public int getSoLop11() { return soLop11; }
    public void setSoLop11(int soLop11) { this.soLop11 = soLop11; }

    public int getSoLop12() { return soLop12; }
    public void setSoLop12(int soLop12) { this.soLop12 = soLop12; }
}
