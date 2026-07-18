package com.hethongtruongthpt.dto.ai;

import java.util.List;

public class AiSuggestionResponse {
    private List<String> diemManh;
    private List<String> diemYeu;
    private List<MonGoiY> goiYMonHoc;
    private List<String> goiYChung;
    private String mucDoHocLuc;
    private List<String> hanhDongCanLam;

    public static class MonGoiY {
        private String mon;
        private String goiY;

        public MonGoiY() {
        }

        public String getMon() {
            return mon;
        }

        public void setMon(String mon) {
            this.mon = mon;
        }

        public String getGoiY() {
            return goiY;
        }

        public void setGoiY(String goiY) {
            this.goiY = goiY;
        }
    }

    public AiSuggestionResponse() {
    }

    public List<String> getDiemManh() {
        return diemManh;
    }

    public void setDiemManh(List<String> diemManh) {
        this.diemManh = diemManh;
    }

    public List<String> getDiemYeu() {
        return diemYeu;
    }

    public void setDiemYeu(List<String> diemYeu) {
        this.diemYeu = diemYeu;
    }

    public List<MonGoiY> getGoiYMonHoc() {
        return goiYMonHoc;
    }

    public void setGoiYMonHoc(List<MonGoiY> goiYMonHoc) {
        this.goiYMonHoc = goiYMonHoc;
    }

    public List<String> getGoiYChung() {
        return goiYChung;
    }

    public void setGoiYChung(List<String> goiYChung) {
        this.goiYChung = goiYChung;
    }

    public String getMucDoHocLuc() {
        return mucDoHocLuc;
    }

    public void setMucDoHocLuc(String mucDoHocLuc) {
        this.mucDoHocLuc = mucDoHocLuc;
    }

    public List<String> getHanhDongCanLam() {
        return hanhDongCanLam;
    }

    public void setHanhDongCanLam(List<String> hanhDongCanLam) {
        this.hanhDongCanLam = hanhDongCanLam;
    }
}
