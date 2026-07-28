package com.hethongtruongthpt.dto.statistics;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ConductStatistics {

    private Map<String, Long> phanBoHanhKiem = new HashMap<>();
    private String lopTotNhat;
    private String lopYeuNhat;
    private List<ClassConduct> theoLop = new ArrayList<>();

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

    public List<ClassConduct> getTheoLop() {
        return theoLop;
    }

    public void setTheoLop(List<ClassConduct> theoLop) {
        this.theoLop = theoLop;
    }

    public static class ClassConduct {
        private String tenLop;
        private long tot;
        private long kha;
        private long trungBinh;
        private long yeu;
        private long tong;

        public ClassConduct() {}

        public ClassConduct(String tenLop, long tot, long kha, long trungBinh, long yeu, long tong) {
            this.tenLop = tenLop;
            this.tot = tot;
            this.kha = kha;
            this.trungBinh = trungBinh;
            this.yeu = yeu;
            this.tong = tong;
        }

        public String getTenLop() { return tenLop; }
        public void setTenLop(String tenLop) { this.tenLop = tenLop; }

        public long getTot() { return tot; }
        public void setTot(long tot) { this.tot = tot; }

        public long getKha() { return kha; }
        public void setKha(long kha) { this.kha = kha; }

        public long getTrungBinh() { return trungBinh; }
        public void setTrungBinh(long trungBinh) { this.trungBinh = trungBinh; }

        public long getYeu() { return yeu; }
        public void setYeu(long yeu) { this.yeu = yeu; }

        public long getTong() { return tong; }
        public void setTong(long tong) { this.tong = tong; }
    }
}
