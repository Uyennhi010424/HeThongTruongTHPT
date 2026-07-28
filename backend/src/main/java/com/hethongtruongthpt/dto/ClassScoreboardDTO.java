package com.hethongtruongthpt.dto;

import java.util.List;
import java.util.Map;

public class ClassScoreboardDTO {
    private Map<String, Object> classInfo;
    private List<SubjectInfo> subjects;
    private List<StudentScoreInfo> students;

    public ClassScoreboardDTO() {}

    public ClassScoreboardDTO(Map<String, Object> classInfo, List<SubjectInfo> subjects, List<StudentScoreInfo> students) {
        this.classInfo = classInfo;
        this.subjects = subjects;
        this.students = students;
    }

    public Map<String, Object> getClassInfo() {
        return classInfo;
    }

    public void setClassInfo(Map<String, Object> classInfo) {
        this.classInfo = classInfo;
    }

    public List<SubjectInfo> getSubjects() {
        return subjects;
    }

    public void setSubjects(List<SubjectInfo> subjects) {
        this.subjects = subjects;
    }

    public List<StudentScoreInfo> getStudents() {
        return students;
    }

    public void setStudents(List<StudentScoreInfo> students) {
        this.students = students;
    }

    public static class SubjectInfo {
        private Integer id;
        private String tenMon;
        private String nhomDanhGia;

        public SubjectInfo(Integer id, String tenMon) {
            this.id = id;
            this.tenMon = tenMon;
        }

        public SubjectInfo(Integer id, String tenMon, String nhomDanhGia) {
            this.id = id;
            this.tenMon = tenMon;
            this.nhomDanhGia = nhomDanhGia;
        }

        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }

        public String getTenMon() {
            return tenMon;
        }

        public void setTenMon(String tenMon) {
            this.tenMon = tenMon;
        }

        public String getNhomDanhGia() {
            return nhomDanhGia;
        }

        public void setNhomDanhGia(String nhomDanhGia) {
            this.nhomDanhGia = nhomDanhGia;
        }
    }

    public static class StudentScoreInfo {
        private Integer id;
        private String maHs;
        private String hoTen;
        private Map<Integer, Object> scores; // monHocId -> avg score (Double or String)
        private Double dtbHk;

        public StudentScoreInfo(Integer id, String maHs, String hoTen, Map<Integer, Object> scores, Double dtbHk) {
            this.id = id;
            this.maHs = maHs;
            this.hoTen = hoTen;
            this.scores = scores;
            this.dtbHk = dtbHk;
        }

        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }

        public String getMaHs() {
            return maHs;
        }

        public void setMaHs(String maHs) {
            this.maHs = maHs;
        }

        public String getHoTen() {
            return hoTen;
        }

        public void setHoTen(String hoTen) {
            this.hoTen = hoTen;
        }

        public Map<Integer, Object> getScores() {
            return scores;
        }

        public void setScores(Map<Integer, Object> scores) {
            this.scores = scores;
        }

        public Double getDtbHk() {
            return dtbHk;
        }

        public void setDtbHk(Double dtbHk) {
            this.dtbHk = dtbHk;
        }
    }
}
