package com.hethongtruongthpt.dto.statistics;

import java.util.ArrayList;
import java.util.List;

public class AttendanceStatistics {

    private long tongNgayVang;
    private double tyLeVang;
    private List<AbsentStudent> topVangNhat = new ArrayList<>();
    private List<ClassAttendance> theoLop = new ArrayList<>();

    public AttendanceStatistics() {
    }

    public long getTongNgayVang() {
        return tongNgayVang;
    }

    public void setTongNgayVang(long tongNgayVang) {
        this.tongNgayVang = tongNgayVang;
    }

    public double getTyLeVang() {
        return tyLeVang;
    }

    public void setTyLeVang(double tyLeVang) {
        this.tyLeVang = tyLeVang;
    }

    public List<AbsentStudent> getTopVangNhat() {
        return topVangNhat;
    }

    public void setTopVangNhat(List<AbsentStudent> topVangNhat) {
        this.topVangNhat = topVangNhat;
    }

    public List<ClassAttendance> getTheoLop() {
        return theoLop;
    }

    public void setTheoLop(List<ClassAttendance> theoLop) {
        this.theoLop = theoLop;
    }

    public static class ClassAttendance {

        private String tenLop;
        private int siSo;
        private long tongVang;
        private long coPhep;
        private long khongPhep;
        private double tyLeVang;

        public ClassAttendance() {
        }

        public ClassAttendance(String tenLop, int siSo, long tongVang, long coPhep, long khongPhep, double tyLeVang) {
            this.tenLop = tenLop;
            this.siSo = siSo;
            this.tongVang = tongVang;
            this.coPhep = coPhep;
            this.khongPhep = khongPhep;
            this.tyLeVang = tyLeVang;
        }

        public String getTenLop() { return tenLop; }
        public void setTenLop(String tenLop) { this.tenLop = tenLop; }
        public int getSiSo() { return siSo; }
        public void setSiSo(int siSo) { this.siSo = siSo; }
        public long getTongVang() { return tongVang; }
        public void setTongVang(long tongVang) { this.tongVang = tongVang; }
        public long getCoPhep() { return coPhep; }
        public void setCoPhep(long coPhep) { this.coPhep = coPhep; }
        public long getKhongPhep() { return khongPhep; }
        public void setKhongPhep(long khongPhep) { this.khongPhep = khongPhep; }
        public double getTyLeVang() { return tyLeVang; }
        public void setTyLeVang(double tyLeVang) { this.tyLeVang = tyLeVang; }
    }

    public static class AbsentStudent {

        private Integer hocSinhId;
        private String hoTen;
        private String tenLop;
        private long soNgayVang;
        private long coPhep;
        private long khongPhep;

        public AbsentStudent() {
        }

        public AbsentStudent(Integer hocSinhId, String hoTen, String tenLop,
                             long soNgayVang, long coPhep, long khongPhep) {
            this.hocSinhId = hocSinhId;
            this.hoTen = hoTen;
            this.tenLop = tenLop;
            this.soNgayVang = soNgayVang;
            this.coPhep = coPhep;
            this.khongPhep = khongPhep;
        }

        public Integer getHocSinhId() {
            return hocSinhId;
        }

        public void setHocSinhId(Integer hocSinhId) {
            this.hocSinhId = hocSinhId;
        }

        public String getHoTen() {
            return hoTen;
        }

        public void setHoTen(String hoTen) {
            this.hoTen = hoTen;
        }

        public String getTenLop() {
            return tenLop;
        }

        public void setTenLop(String tenLop) {
            this.tenLop = tenLop;
        }

        public long getSoNgayVang() {
            return soNgayVang;
        }

        public void setSoNgayVang(long soNgayVang) {
            this.soNgayVang = soNgayVang;
        }

        public long getCoPhep() {
            return coPhep;
        }

        public void setCoPhep(long coPhep) {
            this.coPhep = coPhep;
        }

        public long getKhongPhep() {
            return khongPhep;
        }

        public void setKhongPhep(long khongPhep) {
            this.khongPhep = khongPhep;
        }
    }
}
