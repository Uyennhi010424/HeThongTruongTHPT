package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.PasswordResetToken;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.repository.PasswordResetTokenRepository;
import com.hethongtruongthpt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
public class EmailResetPasswordService {
    private static final Logger log = LoggerFactory.getLogger(EmailResetPasswordService.class);
    
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    // Token hết hạn sau 15 phút
    private static final int EXPIRATION_MINUTES = 15;

    public EmailResetPasswordService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            JavaMailSender mailSender,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
    }

    public void sendResetPasswordEmail(String username) {
        if (username == null || username.isBlank()) {
            throw new ApiException("Username/Email không được để trống");
        }

        User user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ApiException("Không tìm thấy tài khoản với tên đăng nhập này"));

        // Dùng username làm email (do hệ thống tạo email theo format username)
        String email = user.getUsername();
        if (!email.contains("@")) {
            throw new ApiException("Tài khoản chưa được cấu hình Email hợp lệ để nhận mã xác thực");
        }

        // Xóa token cũ của user nếu có
        tokenRepository.deleteByUser(user);

        // Sinh token mới
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(EXPIRATION_MINUTES));
        tokenRepository.save(resetToken);

        // Gửi email
        String resetUrl = "http://localhost:5173/reset-password?token=" + token;
        
        // Kiểm tra xem email có phải là email ảo của trường không
        boolean isVirtualEmail = email.endsWith("@edu.vn") || email.endsWith("@tdu.edu.vn") || email.endsWith("@tdn.edu.vn");
        
        if (isVirtualEmail) {
            // In trực tiếp ra console để nhà quản trị hoặc lập trình viên lấy link
            System.out.println("==================================================================");
            System.out.println("[RESET PASSWORD LINK FOR VIRTUAL EMAIL]: " + email);
            System.out.println(resetUrl);
            System.out.println("==================================================================");
            log.info("Tài khoản {} sử dụng email trường ảo. Đã in link reset mật khẩu ra Console.", username);
            throw new ApiException("Tài khoản sử dụng email nội bộ ảo của trường. Quản trị viên đã nhận được link đặt lại mật khẩu của bạn tại System Console. Vui lòng liên hệ Admin để nhận link.");
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("[THPT ABC] Xác nhận cấp lại mật khẩu tài khoản");
            message.setText("Chào bạn,\n\n"
                    + "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản: " + user.getUsername() + ".\n"
                    + "Vui lòng click vào link dưới đây để đổi mật khẩu mới (link có hiệu lực trong 15 phút):\n"
                    + resetUrl + "\n\n"
                    + "Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email này.\n"
                    + "Trân trọng,\nBan Quản Trị Trường THPT ABC");

            mailSender.send(message);
            log.info("Đã gửi email reset password thành công đến {}", email);
        } catch (Exception ex) {
            log.error("Lỗi khi gửi email đến {}: {}", email, ex.getMessage());
            // Fallback in ra console nếu cấu hình Mail Server lỗi
            System.out.println("============================== FALLBACK ==========================");
            System.out.println("[RESET PASSWORD LINK FALLBACK]: " + email);
            System.out.println(resetUrl);
            System.out.println("==================================================================");
            throw new ApiException("Không thể gửi email xác thực thực tế. Link thay thế đã in ra Server Console. Vui lòng liên hệ Admin để nhận link.");
        }
    }

    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new ApiException("Token không hợp lệ");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new ApiException("Mật khẩu mới không được để trống");
        }

        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ApiException("Token xác thực đổi mật khẩu không tồn tại hoặc đã được sử dụng"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken);
            throw new ApiException("Token đổi mật khẩu đã hết hạn. Vui lòng gửi lại yêu cầu.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        user.setMustChangePassword(false);
        userRepository.save(user);

        // Xóa token sau khi dùng thành công
        tokenRepository.delete(resetToken);
        log.info("Đặt lại mật khẩu thành công cho tài khoản {}", user.getUsername());
    }
}
