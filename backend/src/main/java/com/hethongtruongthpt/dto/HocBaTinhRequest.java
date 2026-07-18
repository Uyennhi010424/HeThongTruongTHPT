package com.hethongtruongthpt.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class HocBaTinhRequest {

    @NotNull(message = "Thiếu mã học sinh")
    @Min(value = 1, message = "Mã học sinh không hợp lệ")
    private Integer hocSinhId;

    @NotNull(message = "Thiếu mã năm học")
    @Min(value = 1, message = "Mã năm học không hợp lệ")
    private Integer namHocId;

    public HocBaTinhRequest() {}

    public Integer getHocSinhId() { return hocSinhId; }
    public void setHocSinhId(Integer hocSinhId) { this.hocSinhId = hocSinhId; }

    public Integer getNamHocId() { return namHocId; }
    public void setNamHocId(Integer namHocId) { this.namHocId = namHocId; }
}
