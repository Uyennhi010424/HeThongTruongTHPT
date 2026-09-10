package com.hethongtruongthpt.dto.hocsinh;

import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.entity.HanhKiem;
import com.hethongtruongthpt.entity.LichThi;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import com.hethongtruongthpt.entity.ThongBao;

import java.util.List;
import java.util.Map;

public class DashboardDataDTO {
    private HocSinhResponseDTO student;
    private List<ThongBao> notices;
    private List<ThoiKhoaBieu> timetable;
    private List<LichThi> exams;
    private List<MonHoc> subjects;
    private List<Diem> scores; // Diem of current student
    private List<HanhKiem> conducts;
    private Map<String, Object> attendanceStats;
    private List<SubjectScoreDTO> subjectScores;
    private List<com.hethongtruongthpt.entity.LichSuHocTap> academicHistories;
    private Double gpa;
    private Integer baiKiemTraCount;
    private boolean examWeek;

    public static class SubjectScoreDTO {
        private Integer monHocId;
        private String tenMon;
        private Double tx;
        private Double gk;
        private Double ck;
        private Double avgScore;
        private String nhanXet;

        public SubjectScoreDTO(Integer monHocId, String tenMon, Double tx, Double gk, Double ck, Double avgScore, String nhanXet) {
            this.monHocId = monHocId;
            this.tenMon = tenMon;
            this.tx = tx;
            this.gk = gk;
            this.ck = ck;
            this.avgScore = avgScore;
            this.nhanXet = nhanXet;
        }

        public Integer getMonHocId() {
            return monHocId;
        }

        public void setMonHocId(Integer monHocId) {
            this.monHocId = monHocId;
        }

        public String getTenMon() {
            return tenMon;
        }

        public void setTenMon(String tenMon) {
            this.tenMon = tenMon;
        }

        public Double getTx() {
            return tx;
        }

        public void setTx(Double tx) {
            this.tx = tx;
        }

        public Double getGk() {
            return gk;
        }

        public void setGk(Double gk) {
            this.gk = gk;
        }

        public Double getCk() {
            return ck;
        }

        public void setCk(Double ck) {
            this.ck = ck;
        }

        public Double getAvgScore() {
            return avgScore;
        }

        public void setAvgScore(Double avgScore) {
            this.avgScore = avgScore;
        }

        public String getNhanXet() {
            return nhanXet;
        }

        public void setNhanXet(String nhanXet) {
            this.nhanXet = nhanXet;
        }
    }

    // Getters and Setters

    public HocSinhResponseDTO getStudent() {
        return student;
    }

    public void setStudent(HocSinhResponseDTO student) {
        this.student = student;
    }

    public List<ThongBao> getNotices() {
        return notices;
    }

    public void setNotices(List<ThongBao> notices) {
        this.notices = notices;
    }

    public List<ThoiKhoaBieu> getTimetable() {
        return timetable;
    }

    public void setTimetable(List<ThoiKhoaBieu> timetable) {
        this.timetable = timetable;
    }

    public List<LichThi> getExams() {
        return exams;
    }

    public void setExams(List<LichThi> exams) {
        this.exams = exams;
    }

    public List<MonHoc> getSubjects() {
        return subjects;
    }

    public void setSubjects(List<MonHoc> subjects) {
        this.subjects = subjects;
    }

    public List<Diem> getScores() {
        return scores;
    }

    public void setScores(List<Diem> scores) {
        this.scores = scores;
    }

    public List<HanhKiem> getConducts() {
        return conducts;
    }

    public void setConducts(List<HanhKiem> conducts) {
        this.conducts = conducts;
    }

    public Map<String, Object> getAttendanceStats() {
        return attendanceStats;
    }

    public void setAttendanceStats(Map<String, Object> attendanceStats) {
        this.attendanceStats = attendanceStats;
    }

    public List<SubjectScoreDTO> getSubjectScores() {
        return subjectScores;
    }

    public void setSubjectScores(List<SubjectScoreDTO> subjectScores) {
        this.subjectScores = subjectScores;
    }

    public Double getGpa() {
        return gpa;
    }

    public void setGpa(Double gpa) {
        this.gpa = gpa;
    }

    public Integer getBaiKiemTraCount() {
        return baiKiemTraCount;
    }

    public void setBaiKiemTraCount(Integer baiKiemTraCount) {
        this.baiKiemTraCount = baiKiemTraCount;
    }

    public List<com.hethongtruongthpt.entity.LichSuHocTap> getAcademicHistories() {
        return academicHistories;
    }

    public void setAcademicHistories(List<com.hethongtruongthpt.entity.LichSuHocTap> academicHistories) {
        this.academicHistories = academicHistories;
    }

    public boolean isExamWeek() {
        return examWeek;
    }

    public void setExamWeek(boolean examWeek) {
        this.examWeek = examWeek;
    }
}
