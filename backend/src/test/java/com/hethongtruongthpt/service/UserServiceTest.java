package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.PhuHuynhRepository;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.util.DefaultAccountPasswordPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private DefaultAccountPasswordPolicy passwordPolicy;
    @Mock private UserAuditLogService auditLogService;
    @Mock private EmailResetPasswordService emailResetPasswordService;
    @Mock private GiaoVienRepository giaoVienRepository;
    @Mock private HocSinhRepository hocSinhRepository;
    @Mock private PhuHuynhRepository phuHuynhRepository;

    @InjectMocks
    private UserService userService;

    private User teacherUser;
    private User studentUser;
    private User parentUser;

    @BeforeEach
    void setUp() {
        teacherUser = new User();
        teacherUser.setId(10);
        teacherUser.setUsername("nguyenan@school.edu.vn");
        teacherUser.setRole(RoleEnum.GIAO_VIEN);

        studentUser = new User();
        studentUser.setId(20);
        studentUser.setUsername("hs0001");
        studentUser.setEmail("student@gmail.com");
        studentUser.setRole(RoleEnum.HOC_SINH);

        parentUser = new User();
        parentUser.setId(30);
        parentUser.setUsername("ph0001");
        parentUser.setRole(RoleEnum.PHU_HUYNH);
    }

    @Test
    @DisplayName("Đặt lại mật khẩu cho Giáo viên thành công và gửi email")
    void resetPasswordToDefault_teacher_success() {
        when(userRepository.findById(10)).thenReturn(Optional.of(teacherUser));
        when(passwordPolicy.getTeacherDefaultPassword("nguyenan@school.edu.vn")).thenReturn("nguyenan@123");
        when(passwordEncoder.encode("nguyenan@123")).thenReturn("hashed_nguyenan@123");

        userService.resetPasswordToDefault(10);

        assertThat(teacherUser.getPassword()).isEqualTo("hashed_nguyenan@123");
        assertThat(teacherUser.getMustChangePassword()).isTrue();
        verify(userRepository).save(teacherUser);
        verify(auditLogService).logAction(eq(10), eq("RESET_PASSWORD"), anyString(), isNull());
        verify(emailResetPasswordService).sendAdminResetPasswordNotification(eq(teacherUser), eq("nguyenan@123"), eq("nguyenan@school.edu.vn"));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu cho Học sinh thành công và gửi email")
    void resetPasswordToDefault_student_success() {
        when(userRepository.findById(20)).thenReturn(Optional.of(studentUser));
        when(passwordPolicy.getStudentDefaultPassword()).thenReturn("Abc1234@");
        when(passwordEncoder.encode("Abc1234@")).thenReturn("hashed_Abc1234@");

        userService.resetPasswordToDefault(20);

        assertThat(studentUser.getPassword()).isEqualTo("hashed_Abc1234@");
        assertThat(studentUser.getMustChangePassword()).isTrue();
        verify(userRepository).save(studentUser);
        verify(emailResetPasswordService).sendAdminResetPasswordNotification(eq(studentUser), eq("Abc1234@"), eq("student@gmail.com"));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu khi user.email rỗng nhưng hồ sơ GiaoVien có email")
    void resetPasswordToDefault_resolveEmailFromGiaoVienProfile() {
        User teacherNoEmail = new User();
        teacherNoEmail.setId(11);
        teacherNoEmail.setUsername("gv001");
        teacherNoEmail.setRole(RoleEnum.GIAO_VIEN);

        GiaoVien gv = new GiaoVien();
        gv.setId(1);
        gv.setEmail("gv001@school.edu.vn");

        when(userRepository.findById(11)).thenReturn(Optional.of(teacherNoEmail));
        when(passwordPolicy.getTeacherDefaultPassword("gv001")).thenReturn("gv001@123");
        when(passwordEncoder.encode("gv001@123")).thenReturn("hashed_gv001@123");
        when(giaoVienRepository.findByUserId(11)).thenReturn(Optional.of(gv));

        userService.resetPasswordToDefault(11);

        verify(emailResetPasswordService).sendAdminResetPasswordNotification(eq(teacherNoEmail), eq("gv001@123"), eq("gv001@school.edu.vn"));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu khi user.email rỗng nhưng hồ sơ PhuHuynh có email")
    void resetPasswordToDefault_resolveEmailFromPhuHuynhProfile() {
        PhuHuynh ph = new PhuHuynh();
        ph.setId(1);
        ph.setEmail("parent@gmail.com");

        when(userRepository.findById(30)).thenReturn(Optional.of(parentUser));
        when(passwordPolicy.getParentDefaultPassword()).thenReturn("Abc1234@");
        when(passwordEncoder.encode("Abc1234@")).thenReturn("hashed_Abc1234@");
        when(phuHuynhRepository.findByUserId(30)).thenReturn(Optional.of(ph));

        userService.resetPasswordToDefault(30);

        verify(emailResetPasswordService).sendAdminResetPasswordNotification(eq(parentUser), eq("Abc1234@"), eq("parent@gmail.com"));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu khi không có email nào: vẫn đổi mật khẩu thành công và không crash")
    void resetPasswordToDefault_noEmail_successWithoutCrash() {
        User noEmailUser = new User();
        noEmailUser.setId(99);
        noEmailUser.setUsername("user_no_email");
        noEmailUser.setRole(RoleEnum.ADMIN);

        when(userRepository.findById(99)).thenReturn(Optional.of(noEmailUser));
        when(passwordPolicy.getStudentDefaultPassword()).thenReturn("Abc1234@");
        when(passwordEncoder.encode("Abc1234@")).thenReturn("hashed_Abc1234@");

        userService.resetPasswordToDefault(99);

        assertThat(noEmailUser.getPassword()).isEqualTo("hashed_Abc1234@");
        verify(userRepository).save(noEmailUser);
        verify(emailResetPasswordService, never()).sendAdminResetPasswordNotification(any(), any(), any());
    }

    @Test
    @DisplayName("Ném ngoại lệ khi không tìm thấy user theo id")
    void resetPasswordToDefault_notFound_throwsException() {
        when(userRepository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.resetPasswordToDefault(999))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Không tìm thấy user");
    }
}
