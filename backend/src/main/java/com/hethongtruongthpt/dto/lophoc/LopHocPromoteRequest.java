package com.hethongtruongthpt.dto.lophoc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class LopHocPromoteRequest {

    @NotBlank(message = "Thiếu năm học hiện tại")
    @Pattern(regexp = "^\\d{4}-\\d{4}$", message = "Năm học phải có định dạng YYYY-YYYY")
    @Size(max = 20, message = "Năm học tối đa 20 ký tự")
    private String currentNamHoc;

    @NotBlank(message = "Thiếu năm học tiếp theo")
    @Pattern(regexp = "^\\d{4}-\\d{4}$", message = "Năm học phải có định dạng YYYY-YYYY")
    @Size(max = 20, message = "Năm học tối đa 20 ký tự")
    private String nextNamHoc;

    public LopHocPromoteRequest() {}

    public String getCurrentNamHoc() { return currentNamHoc; }
    public void setCurrentNamHoc(String currentNamHoc) { this.currentNamHoc = currentNamHoc; }

    public String getNextNamHoc() { return nextNamHoc; }
    public void setNextNamHoc(String nextNamHoc) { this.nextNamHoc = nextNamHoc; }
}
