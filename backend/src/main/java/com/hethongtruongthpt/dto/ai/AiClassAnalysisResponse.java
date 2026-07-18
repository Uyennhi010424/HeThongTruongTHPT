package com.hethongtruongthpt.dto.ai;

import java.util.List;

public class AiClassAnalysisResponse {
    private String tongQuanLop;
    private List<String> diemManhLop;
    private List<String> diemYeuLop;
    private List<HocSinhCanChuY> hocSinhCanChuY;
    private List<String> goiYGiaoVien;
    private List<String> phuongPhapDay;

    public static class HocSinhCanChuY {
        private Integer hocSinhId;
        private String hoTen;
        private String lyDo;
        private String goiY;

        public HocSinhCanChuY() {
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

        public String getLyDo() {
            return lyDo;
        }

        public void setLyDo(String lyDo) {
            this.lyDo = lyDo;
        }

        public String getGoiY() {
            return goiY;
        }

        public void setGoiY(String goiY) {
            this.goiY = goiY;
        }
    }

    public AiClassAnalysisResponse() {
    }

    public String getTongQuanLop() {
        return tongQuanLop;
    }

    public void setTongQuanLop(String tongQuanLop) {
        this.tongQuanLop = tongQuanLop;
    }

    public List<String> getDiemManhLop() {
        return diemManhLop;
    }

    public void setDiemManhLop(List<String> diemManhLop) {
        this.diemManhLop = diemManhLop;
    }

    public List<String> getDiemYeuLop() {
        return diemYeuLop;
    }

    public void setDiemYeuLop(List<String> diemYeuLop) {
        this.diemYeuLop = diemYeuLop;
    }

    public List<HocSinhCanChuY> getHocSinhCanChuY() {
        return hocSinhCanChuY;
    }

    public void setHocSinhCanChuY(List<HocSinhCanChuY> hocSinhCanChuY) {
        this.hocSinhCanChuY = hocSinhCanChuY;
    }

    public List<String> getGoiYGiaoVien() {
        return goiYGiaoVien;
    }

    public void setGoiYGiaoVien(List<String> goiYGiaoVien) {
        this.goiYGiaoVien = goiYGiaoVien;
    }

    public List<String> getPhuongPhapDay() {
        return phuongPhapDay;
    }

    public void setPhuongPhapDay(List<String> phuongPhapDay) {
        this.phuongPhapDay = phuongPhapDay;
    }
}
