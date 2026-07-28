package com.hethongtruongthpt.service;

import com.hethongtruongthpt.config.JwtTokenProvider;
import com.hethongtruongthpt.dto.auth.LoginRequest;
import com.hethongtruongthpt.dto.auth.LoginResponse;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.RefreshToken;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.entity.TokenBlacklist;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.RefreshTokenRepository;
import com.hethongtruongthpt.repository.TokenBlacklistRepository;
import com.hethongtruongthpt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UserRepository userRepository;
    private final HocSinhRepository hocSinhRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final TokenBlacklistCache tokenBlacklistCache;
    private final UserAuditLogService auditLogService;

    public AuthService(
            UserRepository userRepository,
            HocSinhRepository hocSinhRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            RefreshTokenRepository refreshTokenRepository,
            TokenBlacklistRepository tokenBlacklistRepository,
            TokenBlacklistCache tokenBlacklistCache,
            UserAuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenBlacklistRepository = tokenBlacklistRepository;
        this.tokenBlacklistCache = tokenBlacklistCache;
        this.auditLogService = auditLogService;
    }

    private static final long REFRESH_TOKEN_EXPIRY_DAYS = 30;
    private static final int STATUS_GRADUATED = 2; // Đã tốt nghiệp

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String username = request.getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("Đăng nhập thất bại: tài khoản '{}' không tồn tại", username);
                    return new ApiException("Sai tài khoản hoặc mật khẩu");
                });

        if (user.getIsActive() != null && !user.getIsActive()) {
            log.warn("Đăng nhập thất bại: tài khoản '{}' đã bị khóa", username);
            throw new ApiException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        String storedPassword = user.getPassword();
        if (storedPassword == null || storedPassword.isBlank()) {
            log.warn("Đăng nhập thất bại: tài khoản '{}' chưa có mật khẩu", username);
            throw new ApiException("Sai tài khoản hoặc mật khẩu");
        }

        boolean isBcrypt = storedPassword.matches("^\\$2[aby]\\$\\d{2}\\$.+");
        if (!isBcrypt) {
            log.warn("Đăng nhập thất bại: tài khoản '{}' dùng mật khẩu plaintext", username);
            throw new ApiException("Tài khoản chưa được thiết lập mật khẩu an toàn. Vui lòng liên hệ quản trị viên.");
        }

        if (!passwordEncoder.matches(request.getPassword(), storedPassword)) {
            log.warn("Đăng nhập thất bại: sai mật khẩu cho tài khoản '{}'", username);
            throw new ApiException("Sai tài khoản hoặc mật khẩu");
        }

        // Kiểm tra học sinh đã tốt nghiệp
        if (user.getRole() == RoleEnum.HOC_SINH) {
            HocSinh hocSinh = hocSinhRepository.findByUserId(user.getId()).orElse(null);
            if (hocSinh != null && hocSinh.getTrangThai() != null && hocSinh.getTrangThai() == STATUS_GRADUATED) {
                log.warn("Đăng nhập thất bại: học sinh '{}' đã tốt nghiệp", username);
                throw new ApiException("Bạn đã tốt nghiệp. Không thể đăng nhập vào hệ thống.");
            }
        }

        log.info("Đăng nhập thành công: user={}, role={}", username, user.getRole());
        String role = user.getRole() != null ? user.getRole().name() : null;
        String token = jwtTokenProvider.generateToken(user.getUsername(), role);
        String refreshToken = createRefreshToken(user);
        boolean mustChange = Boolean.TRUE.equals(user.getMustChangePassword());

        // Clear flag after first login
        if (mustChange) {
            user.setMustChangePassword(false);
        }
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        auditLogService.logAction(user.getId(), "LOGIN", "Đăng nhập hệ thống", null);

        return new LoginResponse(token, refreshToken, role, mustChange);
    }

    @Transactional
    public LoginResponse refresh(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> {
                    log.warn("Refresh token không hợp lệ");
                    return new ApiException("Refresh token không hợp lệ");
                });

        if (refreshToken.getIsRevoked()) {
            log.warn("Refresh token đã bị thu hồi cho user={}", refreshToken.getUser().getUsername());
            throw new ApiException("Refresh token đã bị thu hồi");
        }
        if (refreshToken.getExpiredAt().isBefore(LocalDateTime.now())) {
            log.warn("Refresh token đã hết hạn cho user={}", refreshToken.getUser().getUsername());
            throw new ApiException("Refresh token đã hết hạn");
        }

        User user = refreshToken.getUser();
        if (user.getIsActive() != null && !user.getIsActive()) {
            log.warn("Refresh token bị từ chối: tài khoản '{}' đã bị khóa", user.getUsername());
            throw new ApiException("Tài khoản đã bị khóa");
        }

        log.info("Refresh token thành công: user={}", user.getUsername());

        // Revoke old token
        refreshToken.setIsRevoked(true);
        refreshTokenRepository.save(refreshToken);

        // Generate new tokens
        String role = user.getRole() != null ? user.getRole().name() : null;
        String newToken = jwtTokenProvider.generateToken(user.getUsername(), role);
        String newRefreshToken = createRefreshToken(user);

        return new LoginResponse(newToken, newRefreshToken, role, false);
    }

    @Transactional
    public void logout(String token) {
        if (token == null || token.isBlank()) return;

        // Add JWT to blacklist
        java.util.Date expiry = jwtTokenProvider.getExpirationFromToken(token);
        TokenBlacklist entry = new TokenBlacklist();
        entry.setToken(token);
        entry.setExpiryDate(expiry.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime());
        tokenBlacklistRepository.save(entry);
        if (token != null) {
            tokenBlacklistCache.markBlacklisted(token);
        }
        
        try {
            String username = jwtTokenProvider.getUsernameFromToken(token);
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                auditLogService.logAction(user.getId(), "LOGOUT", "Đăng xuất hệ thống", null);
                refreshTokenRepository.deleteByUser(user);
            }
        } catch (Exception e) {
            log.debug("Could not log audit for logout: " + e.getMessage());
        }
    }

    public boolean isTokenBlacklisted(String token) {
        return tokenBlacklistRepository.existsByToken(token);
    }

    private String createRefreshToken(User user) {
        String tokenValue = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(tokenValue);
        refreshToken.setExpiredAt(LocalDateTime.now().plusDays(REFRESH_TOKEN_EXPIRY_DAYS));
        refreshTokenRepository.save(refreshToken);
        return tokenValue;
    }
}
