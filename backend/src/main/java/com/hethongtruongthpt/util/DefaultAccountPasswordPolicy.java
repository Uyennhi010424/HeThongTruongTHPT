package com.hethongtruongthpt.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DefaultAccountPasswordPolicy {

    @Value("${student-default-password:}")
    private String studentDefaultPassword;

    @Value("${parent-default-password:}")
    private String parentDefaultPassword;

    @Value("${teacher-default-suffix:@123}")
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
        String suffix = (teacherDefaultSuffix != null && !teacherDefaultSuffix.isBlank()) ? teacherDefaultSuffix : "@123";
        if (username == null || username.isBlank()) {
            return "gv" + suffix;
        }
        String localPart = username.trim();
        int atIndex = localPart.indexOf('@');
        if (atIndex >= 0) {
            localPart = localPart.substring(0, atIndex);
        }
        return localPart + suffix;
    }
}