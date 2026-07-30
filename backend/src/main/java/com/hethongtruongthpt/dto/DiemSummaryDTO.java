package com.hethongtruongthpt.dto;

import java.math.BigDecimal;

public interface DiemSummaryDTO {
    Integer getHoc_sinh_id();
    Integer getMon_hoc_id();
    String getLoai_diem();
    Integer getSo_thu_tu();
    Integer getHoc_ky();
    String getNam_hoc();
    BigDecimal getGia_tri();
    String getNhan_xet();
    Integer getLop_id();
    Integer getKhoi();
}
