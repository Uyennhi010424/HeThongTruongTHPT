package com.hethongtruongthpt.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("DefaultAccountPasswordPolicy")
class DefaultAccountPasswordPolicyTest {

    private DefaultAccountPasswordPolicy policy;

    @BeforeEach
    void setUp() {
        policy = new DefaultAccountPasswordPolicy();
        ReflectionTestUtils.setField(policy, "studentDefaultPassword", "Abc1234@");
        ReflectionTestUtils.setField(policy, "parentDefaultPassword", "Abc1234@");
        ReflectionTestUtils.setField(policy, "teacherDefaultSuffix", "@123");
    }

    @Test
    @DisplayName("Học sinh lấy đúng mật khẩu Abc1234@")
    void getStudentDefaultPassword() {
        assertThat(policy.getStudentDefaultPassword()).isEqualTo("Abc1234@");
    }

    @Test
    @DisplayName("Phụ huynh lấy đúng mật khẩu Abc1234@")
    void getParentDefaultPassword() {
        assertThat(policy.getParentDefaultPassword()).isEqualTo("Abc1234@");
    }

    @Test
    @DisplayName("Giáo viên có email lấy phần trước @ cộng thêm @123")
    void getTeacherDefaultPassword_email() {
        assertThat(policy.getTeacherDefaultPassword("nguyenan@school.edu.vn")).isEqualTo("nguyenan@123");
        assertThat(policy.getTeacherDefaultPassword("teacher.math@domain.com")).isEqualTo("teacher.math@123");
    }

    @Test
    @DisplayName("Giáo viên có username không chứa @ cộng thêm @123")
    void getTeacherDefaultPassword_plainUsername() {
        assertThat(policy.getTeacherDefaultPassword("gv0001")).isEqualTo("gv0001@123");
    }

    @Test
    @DisplayName("Giáo viên khi username rỗng hoặc null trả về gv@123")
    void getTeacherDefaultPassword_nullOrBlank() {
        assertThat(policy.getTeacherDefaultPassword(null)).isEqualTo("gv@123");
        assertThat(policy.getTeacherDefaultPassword("")).isEqualTo("gv@123");
        assertThat(policy.getTeacherDefaultPassword("   ")).isEqualTo("gv@123");
    }
}
