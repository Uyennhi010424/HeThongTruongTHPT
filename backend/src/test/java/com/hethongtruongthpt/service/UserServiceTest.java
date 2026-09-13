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
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_random_pwd");

        String newPassword = userService.resetPasswordToDefault(10);

        assertThat(newPassword).isNotEmpty();
        assertThat(newPassword.length()).isGreaterThanOrEqualTo(8);
        assertThat(teacherUser.getPassword()).isEqualTo("hashed_random_pwd");
        assertThat(teacherUser.getMustChangePassword()).isTrue();
        verify(userRepository).save(teacherUser);
        verify(auditLogService).logAction(eq(10), eq("RESET_PASSWORD"), anyString(), isNull());
        verify(emailResetPasswordService).sendAdminResetPasswordNotification(eq(teacherUser), eq(newPassword), eq("nguyenan@school.edu.vn"));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu cho Học sinh thành công và gửi email")
    void resetPasswordToDefault_student_success() {
        when(userRepository.findById(20)).thenReturn(Optional.of(studentUser));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_random_pwd");

        String newPassword = userService.resetPasswordToDefault(20);

        assertThat(newPassword).isNotEmpty();
        assertThat(newPassword.length()).isGreaterThanOrEqualTo(8);
        assertThat(studentUser.getPassword()).isEqualTo("hashed_random_pwd");
        assertThat(studentUser.getMustChangePassword()).isTrue();
        verify(userRepository).save(studentUser);
        verify(emailResetPasswordService).sendAdminResetPasswordNotification(eq(studentUser), eq(newPassword), eq("student@gmail.com"));
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
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_random_pwd");
        when(giaoVienRepository.findByUserId(11)).thenReturn(Optional.of(gv));

        String newPassword = userService.resetPasswordToDefault(11);

        assertThat(newPassword).isNotEmpty();
        verify(emailResetPasswordService).sendAdminResetPasswordNotification(eq(teacherNoEmail), eq(newPassword), eq("gv001@school.edu.vn"));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu khi user.email rỗng nhưng hồ sơ PhuHuynh có email")
    void resetPasswordToDefault_resolveEmailFromPhuHuynhProfile() {
        PhuHuynh ph = new PhuHuynh();
        ph.setId(1);
        ph.setEmail("parent@gmail.com");

        when(userRepository.findById(30)).thenReturn(Optional.of(parentUser));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_random_pwd");
        when(phuHuynhRepository.findByUserId(30)).thenReturn(Optional.of(ph));

        String newPassword = userService.resetPasswordToDefault(30);

        assertThat(newPassword).isNotEmpty();
        verify(emailResetPasswordService).sendAdminResetPasswordNotification(eq(parentUser), eq(newPassword), eq("parent@gmail.com"));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu khi không có email nào: vẫn đổi mật khẩu thành công và không crash")
    void resetPasswordToDefault_noEmail_successWithoutCrash() {
        User noEmailUser = new User();
        noEmailUser.setId(99);
        noEmailUser.setUsername("user_no_email");
        noEmailUser.setRole(RoleEnum.ADMIN);

        when(userRepository.findById(99)).thenReturn(Optional.of(noEmailUser));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_random_pwd");

        String newPassword = userService.resetPasswordToDefault(99);

        assertThat(newPassword).isNotEmpty();
        assertThat(noEmailUser.getPassword()).isEqualTo("hashed_random_pwd");
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

    @Test
    @DisplayName("Đổi mật khẩu thành công khi đáp ứng đầy đủ độ phức tạp và mật khẩu cũ đúng")
    void changePassword_success() {
        String bcryptOldPwd = "$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12";
        teacherUser.setPassword(bcryptOldPwd);
        when(userRepository.findById(10)).thenReturn(Optional.of(teacherUser));
        when(passwordEncoder.matches("OldPassword123@", bcryptOldPwd)).thenReturn(true);
        when(passwordEncoder.encode("NewStrongPassword123@")).thenReturn("hashed_new_pwd");

        userService.changePassword(10, "OldPassword123@", "NewStrongPassword123@");

        assertThat(teacherUser.getPassword()).isEqualTo("hashed_new_pwd");
        assertThat(teacherUser.getMustChangePassword()).isFalse();
        verify(userRepository).save(teacherUser);
        verify(auditLogService).logAction(eq(10), eq("CHANGE_PASSWORD"), anyString(), isNull());
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi mật khẩu mới trùng mật khẩu cũ")
    void changePassword_samePassword_throwsException() {
        assertThatThrownBy(() -> userService.changePassword(10, "SamePassword123@", "SamePassword123@"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Mật khẩu mới không được trùng với mật khẩu cũ");
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi thiếu chữ hoa, số hoặc ký tự đặc biệt")
    void changePassword_weakPassword_throwsException() {
        assertThatThrownBy(() -> userService.changePassword(10, "OldPassword123@", "weakpassword"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Mật khẩu mới");
    }
}
