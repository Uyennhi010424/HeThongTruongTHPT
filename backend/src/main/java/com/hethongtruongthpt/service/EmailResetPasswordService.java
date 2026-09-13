package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.PasswordResetToken;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.repository.PasswordResetTokenRepository;
import com.hethongtruongthpt.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

    @Value("${spring.mail.username:c3truongthptabc@gmail.com}")
    private String mailFrom;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

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

        String input = username.trim();
        User user = userRepository.findByUsernameIgnoreCase(input)
                .or(() -> userRepository.findByEmailIgnoreCase(input))
                .orElseThrow(() -> new ApiException("Không tìm thấy tài khoản với tên đăng nhập hoặc email này"));

        // Lấy email nhận thư (ưu tiên trường email, fallback là username nếu chứa @)
        String email = (user.getEmail() != null && user.getEmail().contains("@")) ? user.getEmail().trim() : user.getUsername().trim();
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

        // Link đặt lại mật khẩu
        String resetUrl = (frontendUrl != null ? frontendUrl : "http://localhost:5173") + "/reset-password?token=" + token;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(mailFrom, "Hệ Thống Trường THPT");
            helper.setTo(email);
            helper.setSubject("[Trường THPT] Xác nhận cấp lại mật khẩu tài khoản");

            String htmlBody = buildHtmlEmailContent(user.getUsername(), resetUrl);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Đã gửi email reset password thực tế thành công đến {}", email);
        } catch (Exception ex) {
            log.error("Lỗi gửi email qua SMTP đến {}: {}", email, ex.getMessage());
            // In link ra console để kiểm thử/hỗ trợ khi cần thiết
            System.out.println("==================================================================");
            System.out.println("[RESET PASSWORD LINK]: " + user.getUsername() + " (" + email + ")");
            System.out.println(resetUrl);
            System.out.println("==================================================================");
            
            throw new ApiException("Không thể gửi email đến " + email + ". Vui lòng kiểm tra lại cấu hình SMTP/Mật khẩu ứng dụng Gmail: " + ex.getMessage());
        }
    }

    private String buildHtmlEmailContent(String recipientName, String resetUrl) {
        return "<!DOCTYPE html>"
                + "<html lang='vi'>"
                + "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'></head>"
                + "<body style='margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;'>"
                + "  <table width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color:#F1F5F9;padding:40px 10px;'>"
                + "    <tr>"
                + "      <td align='center'>"
                + "        <table width='100%' maxWidth='600' border='0' cellspacing='0' cellpadding='0' style='max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.06);border:1px solid #E2E8F0;'>"
                + "          <!-- Header -->"
                + "          <tr>"
                + "            <td style='background:linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%);padding:36px 30px;text-align:center;color:#FFFFFF;'>"
                + "              <h1 style='margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;'>TRƯỜNG THPT</h1>"
                + "              <p style='margin:6px 0 0 0;font-size:14px;color:#BFDBFE;text-transform:uppercase;letter-spacing:1px;'>Hệ Thống Quản Lý Giáo Dục</p>"
                + "            </td>"
                + "          </tr>"
                + "          <!-- Content -->"
                + "          <tr>"
                + "            <td style='padding:36px 32px;color:#334155;line-height:1.6;'>"
                + "              <h2 style='margin:0 0 16px 0;font-size:20px;color:#0F172A;'>Yêu cầu cấp lại mật khẩu</h2>"
                + "              <p style='margin:0 0 16px 0;font-size:15px;'>Xin chào <strong>" + recipientName + "</strong>,</p>"
                + "              <p style='margin:0 0 24px 0;font-size:15px;color:#475569;'>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên hệ thống. Để tiến hành đổi mật khẩu mới, vui lòng nhấp vào nút bên dưới:</p>"
                + "              <!-- CTA Button -->"
                + "              <div style='text-align:center;margin:32px 0;'>"
                + "                <a href='" + resetUrl + "' target='_blank' style='background:linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:600;display:inline-block;box-shadow:0 4px 12px rgba(37,99,235,0.25);'>ĐẶT LẠI MẬT KHẨU</a>"
                + "              </div>"
                + "              <!-- Warning Box -->"
                + "              <div style='background:#FEF3C7;border-left:4px solid #F59E0B;padding:14px 16px;border-radius:6px;margin:24px 0;'>"
                + "                <p style='margin:0;font-size:13px;color:#92400E;'><strong>Lưu ý:</strong> Liên kết này chỉ có hiệu lực trong vòng <strong>15 phút</strong>. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua thư để giữ an toàn cho tài khoản.</p>"
                + "              </div>"
                + "              <p style='margin:24px 0 8px 0;font-size:13px;color:#64748B;'>Nếu nút bấm trên không hoạt động, bạn có thể sao chép và dán trực tiếp đường dẫn sau vào trình duyệt:</p>"
                + "              <p style='margin:0;font-size:12px;color:#2563EB;word-break:break-all;'><a href='" + resetUrl + "' style='color:#2563EB;'>" + resetUrl + "</a></p>"
                + "            </td>"
                + "          </tr>"
                + "          <!-- Footer -->"
                + "          <tr>"
                + "            <td style='background:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 32px;text-align:center;color:#94A3B8;font-size:12px;line-height:1.5;'>"
                + "              <p style='margin:0;'>© 2026 Trường THPT. Mọi quyền được bảo lưu.</p>"
                + "              <p style='margin:4px 0 0 0;'>Đây là email tự động từ hệ thống, vui lòng không phản hồi thư này.</p>"
                + "            </td>"
                + "          </tr>"
                + "        </table>"
                + "      </td>"
                + "    </tr>"
                + "  </table>"
                + "</body>"
                + "</html>";
    }

    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new ApiException("Token không hợp lệ");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new ApiException("Mật khẩu mới không được để trống");
        }
        UserService.validatePasswordStrength(newPassword.trim());

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

    public void sendAdminResetPasswordNotification(User user, String newRawPassword, String targetEmail) {
        if (targetEmail == null || !targetEmail.contains("@")) {
            log.warn("Không thể gửi email thông báo reset mật khẩu cho user {}: email không hợp lệ ({})", user.getUsername(), targetEmail);
            return;
        }

        String loginUrl = (frontendUrl != null ? frontendUrl : "http://localhost:5173") + "/login";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom, "Hệ Thống Trường THPT");
            helper.setTo(targetEmail.trim());
            helper.setSubject("[Trường THPT] Thông báo cấp lại mật khẩu tài khoản");

            String htmlBody = buildAdminResetPasswordEmailContent(user.getUsername(), newRawPassword, loginUrl);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Đã gửi email thông báo cấp lại mật khẩu thành công đến {}", targetEmail);
        } catch (Exception ex) {
            log.error("Lỗi khi gửi email thông báo cấp lại mật khẩu đến {}: {}", targetEmail, ex.getMessage());
        }
    }

    private String buildAdminResetPasswordEmailContent(String username, String newPassword, String loginUrl) {
        return "<!DOCTYPE html>"
                + "<html lang='vi'>"
                + "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'></head>"
                + "<body style='margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;'>"
                + "  <table width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color:#F1F5F9;padding:40px 10px;'>"
                + "    <tr>"
                + "      <td align='center'>"
                + "        <table width='100%' maxWidth='600' border='0' cellspacing='0' cellpadding='0' style='max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.06);border:1px solid #E2E8F0;'>"
                + "          <!-- Header -->"
                + "          <tr>"
                + "            <td style='background:linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%);padding:36px 30px;text-align:center;color:#FFFFFF;'>"
                + "              <h1 style='margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;'>TRƯỜNG THPT</h1>"
                + "              <p style='margin:6px 0 0 0;font-size:14px;color:#BFDBFE;text-transform:uppercase;letter-spacing:1px;'>Hệ Thống Quản Lý Giáo Dục</p>"
                + "            </td>"
                + "          </tr>"
                + "          <!-- Content -->"
                + "          <tr>"
                + "            <td style='padding:36px 32px;color:#334155;line-height:1.6;'>"
                + "              <h2 style='margin:0 0 16px 0;font-size:20px;color:#0F172A;'>Mật khẩu của bạn đã được đặt lại</h2>"
                + "              <p style='margin:0 0 16px 0;font-size:15px;'>Xin chào <strong>" + username + "</strong>,</p>"
                + "              <p style='margin:0 0 20px 0;font-size:15px;color:#475569;'>Quản trị viên hệ thống đã đặt lại mật khẩu cho tài khoản của bạn. Dưới đây là thông tin đăng nhập mới:</p>"
                + "              <!-- Info Box -->"
                + "              <div style='background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:20px 0;'>"
                + "                <table width='100%' border='0' cellspacing='0' cellpadding='0'>"
                + "                  <tr>"
                + "                    <td style='padding:6px 0;color:#64748B;font-size:14px;width:140px;'>Tên đăng nhập:</td>"
                + "                    <td style='padding:6px 0;color:#0F172A;font-size:15px;font-weight:600;'>" + username + "</td>"
                + "                  </tr>"
                + "                  <tr>"
                + "                    <td style='padding:6px 0;color:#64748B;font-size:14px;'>Mật khẩu mới:</td>"
                + "                    <td style='padding:6px 0;color:#2563EB;font-size:16px;font-weight:700;font-family:monospace;'>" + newPassword + "</td>"
                + "                  </tr>"
                + "                </table>"
                + "              </div>"
                + "              <!-- CTA Button -->"
                + "              <div style='text-align:center;margin:32px 0;'>"
                + "                <a href='" + loginUrl + "' target='_blank' style='background:linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:600;display:inline-block;box-shadow:0 4px 12px rgba(37,99,235,0.25);'>ĐĂNG NHẬP NGAY</a>"
                + "              </div>"
                + "              <!-- Security Note -->"
                + "              <div style='background:#FEF3C7;border-left:4px solid #F59E0B;padding:14px 16px;border-radius:6px;margin:24px 0;'>"
                + "                <p style='margin:0;font-size:13px;color:#92400E;'><strong>Lưu ý bảo mật:</strong> Để đảm bảo an toàn, vui lòng đổi lại mật khẩu cá nhân ngay trong lần đăng nhập đầu tiên.</p>"
                + "              </div>"
                + "            </td>"
                + "          </tr>"
                + "          <!-- Footer -->"
                + "          <tr>"
                + "            <td style='background:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 32px;text-align:center;color:#94A3B8;font-size:12px;line-height:1.5;'>"
                + "              <p style='margin:0;'>© 2026 Trường THPT. Mọi quyền được bảo lưu.</p>"
                + "              <p style='margin:4px 0 0 0;'>Đây là email tự động từ hệ thống, vui lòng không phản hồi thư này.</p>"
                + "            </td>"
                + "          </tr>"
                + "        </table>"
                + "      </td>"
                + "    </tr>"
                + "  </table>"
                + "</body>"
                + "</html>";
    }
}
