package com.hethongtruongthpt.dto.statistics;

import java.util.HashMap;
import java.util.Map;

public class ConductStatistics {

    private Map<String, Long> phanBoHanhKiem = new HashMap<>();
    private String lopTotNhat;
    private String lopYeuNhat;

    public ConductStatistics() {
    }

    public Map<String, Long> getPhanBoHanhKiem() {
        return phanBoHanhKiem;
    }

    public void setPhanBoHanhKiem(Map<String, Long> phanBoHanhKiem) {
        this.phanBoHanhKiem = phanBoHanhKiem;
    }

    public String getLopTotNhat() {
        return lopTotNhat;
    }

    public void setLopTotNhat(String lopTotNhat) {
        this.lopTotNhat = lopTotNhat;
    }

    public String getLopYeuNhat() {
        return lopYeuNhat;
    }

    public void setLopYeuNhat(String lopYeuNhat) {
        this.lopYeuNhat = lopYeuNhat;
    }
}
