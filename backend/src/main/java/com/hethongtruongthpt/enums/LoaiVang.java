package com.hethongtruongthpt.enums;

public enum LoaiVang {
    CO_MAT("Có mặt"),
    CO_PHEP("Vắng có phép"),
    KHONG_PHEP("Vắng không phép");

    private final String label;

    LoaiVang(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
