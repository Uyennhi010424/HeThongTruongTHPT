package com.hethongtruongthpt.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class HocBaTinhLopRequest {

    @NotNull(message = "Thiếu mã lớp")
    @Min(value = 1, message = "Mã lớp không hợp lệ")
    private Integer lopId;

    @NotNull(message = "Thiếu mã năm học")
    @Min(value = 1, message = "Mã năm học không hợp lệ")
    private Integer namHocId;

    public HocBaTinhLopRequest() {}

    public Integer getLopId() { return lopId; }
    public void setLopId(Integer lopId) { this.lopId = lopId; }

    public Integer getNamHocId() { return namHocId; }
    public void setNamHocId(Integer namHocId) { this.namHocId = namHocId; }
}
