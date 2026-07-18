package com.hethongtruongthpt.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DefaultAccountPasswordPolicy {

    @Value("${student-default-password:}")
    private String studentDefaultPassword;

    @Value("${parent-default-password:}")
    private String parentDefaultPassword;

    @Value("${teacher-default-suffix:@tdn.edu.vn}")
    private String teacherDefaultSuffix;

    public String getStudentDefaultPassword() {
        if (studentDefaultPassword == null || studentDefaultPassword.isBlank()) {
            throw new IllegalStateException(
                "STUDENT_DEFAULT_PASSWORD chưa được cấu hình! Hãy set env STUDENT_DEFAULT_PASSWORD trong file .env"
            );
        }
        return studentDefaultPassword;
    }

    public String getParentDefaultPassword() {
        if (parentDefaultPassword == null || parentDefaultPassword.isBlank()) {
            throw new IllegalStateException(
                "PARENT_DEFAULT_PASSWORD chưa được cấu hình! Hãy set env PARENT_DEFAULT_PASSWORD trong file .env"
            );
        }
        return parentDefaultPassword;
    }

    public String getTeacherDefaultPassword(String username) {
        if (teacherDefaultSuffix == null || teacherDefaultSuffix.isBlank()) {
            throw new IllegalStateException(
                "TEACHER_DEFAULT_SUFFIX chưa được cấu hình! Hãy set env TEACHER_DEFAULT_SUFFIX."
            );
        }
        if (username == null || username.isBlank()) {
            return teacherDefaultSuffix;
        }
        String localPart = username.trim();
        int atIndex = localPart.indexOf('@');
        if (atIndex >= 0) {
            localPart = localPart.substring(0, atIndex);
        }
        return localPart + teacherDefaultSuffix;
    }
}