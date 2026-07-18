package com.hethongtruongthpt.dto.statistics;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AcademicStatistics {

    private int tongHocSinh;
    private double diemTBToanTruong;
    private Map<String, Long> phanLoaiHocLuc = new HashMap<>();
    private List<TopStudent> topStudents = new ArrayList<>();

    public AcademicStatistics() {
    }

    public int getTongHocSinh() {
        return tongHocSinh;
    }

    public void setTongHocSinh(int tongHocSinh) {
        this.tongHocSinh = tongHocSinh;
    }

    public double getDiemTBToanTruong() {
        return diemTBToanTruong;
    }

    public void setDiemTBToanTruong(double diemTBToanTruong) {
        this.diemTBToanTruong = diemTBToanTruong;
    }

    public Map<String, Long> getPhanLoaiHocLuc() {
        return phanLoaiHocLuc;
    }

    public void setPhanLoaiHocLuc(Map<String, Long> phanLoaiHocLuc) {
        this.phanLoaiHocLuc = phanLoaiHocLuc;
    }

    public List<TopStudent> getTopStudents() {
        return topStudents;
    }

    public void setTopStudents(List<TopStudent> topStudents) {
        this.topStudents = topStudents;
    }

    public static class TopStudent {

        private String hoTen;
        private String tenLop;
        private double diemTB;

        public TopStudent() {
        }

        public TopStudent(String hoTen, String tenLop, double diemTB) {
            this.hoTen = hoTen;
            this.tenLop = tenLop;
            this.diemTB = diemTB;
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

        public double getDiemTB() {
            return diemTB;
        }

        public void setDiemTB(double diemTB) {
            this.diemTB = diemTB;
        }
    }
}
