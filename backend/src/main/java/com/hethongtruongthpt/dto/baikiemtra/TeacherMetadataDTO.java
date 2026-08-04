package com.hethongtruongthpt.dto.baikiemtra;

import java.util.List;

public class TeacherMetadataDTO {
    private List<ClassInfo> classes;
    private List<SubjectInfo> subjects;

    public TeacherMetadataDTO() {}

    public TeacherMetadataDTO(List<ClassInfo> classes, List<SubjectInfo> subjects) {
        this.classes = classes;
        this.subjects = subjects;
    }

    public List<ClassInfo> getClasses() { return classes; }
    public void setClasses(List<ClassInfo> classes) { this.classes = classes; }

    public List<SubjectInfo> getSubjects() { return subjects; }
    public void setSubjects(List<SubjectInfo> subjects) { this.subjects = subjects; }

    public static class ClassInfo {
        private Integer id;
        private String name;

        public ClassInfo() {}
        public ClassInfo(Integer id, String name) { this.id = id; this.name = name; }
        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class SubjectInfo {
        private Integer id;
        private String name;

        public SubjectInfo() {}
        public SubjectInfo(Integer id, String name) { this.id = id; this.name = name; }
        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }
}
