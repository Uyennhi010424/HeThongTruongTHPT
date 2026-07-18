package com.hethongtruongthpt.dto.statistics;

import java.util.HashMap;
import java.util.Map;

public class OverviewStatistics {

    private int tongHocSinh;
    private int tongGiaoVien;
    private int tongLop;
    private Map<Integer, KhoiStats> theoKhoi = new HashMap<>();

    public OverviewStatistics() {
    }

    public int getTongHocSinh() {
        return tongHocSinh;
    }

    public void setTongHocSinh(int tongHocSinh) {
        this.tongHocSinh = tongHocSinh;
    }

    public int getTongGiaoVien() {
        return tongGiaoVien;
    }

    public void setTongGiaoVien(int tongGiaoVien) {
        this.tongGiaoVien = tongGiaoVien;
    }

    public int getTongLop() {
        return tongLop;
    }

    public void setTongLop(int tongLop) {
        this.tongLop = tongLop;
    }

    public Map<Integer, KhoiStats> getTheoKhoi() {
        return theoKhoi;
    }

    public void setTheoKhoi(Map<Integer, KhoiStats> theoKhoi) {
        this.theoKhoi = theoKhoi;
    }

    public static class KhoiStats {

        private int soLop;
        private int siSo;

        public KhoiStats() {
        }

        public KhoiStats(int soLop, int siSo) {
            this.soLop = soLop;
            this.siSo = siSo;
        }

        public int getSoLop() {
            return soLop;
        }

        public void setSoLop(int soLop) {
            this.soLop = soLop;
        }

        public int getSiSo() {
            return siSo;
        }

        public void setSiSo(int siSo) {
            this.siSo = siSo;
        }
    }
}
