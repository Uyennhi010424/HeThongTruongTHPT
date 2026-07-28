package com.hethongtruongthpt.service;

import com.hethongtruongthpt.config.JwtTokenProvider;
import com.hethongtruongthpt.dto.auth.LoginRequest;
import com.hethongtruongthpt.dto.auth.LoginResponse;
import com.hethongtruongthpt.entity.RefreshToken;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.RefreshTokenRepository;
import com.hethongtruongthpt.repository.TokenBlacklistRepository;
import com.hethongtruongthpt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
@SuppressWarnings("null")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private HocSinhRepository hocSinhRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private TokenBlacklistRepository tokenBlacklistRepository;
    @Mock private TokenBlacklistCache tokenBlacklistCache;
    @Mock private UserAuditLogService userAuditLogService;

    // Use real JwtTokenProvider since Mockito can't mock it on Java 23
    private JwtTokenProvider jwtTokenProvider;

    private AuthService authService;

    private User sampleUser;

    private LoginRequest loginRequest(String username, String password) {
        LoginRequest req = new LoginRequest();
        req.setUsername(username);
        req.setPassword(password);
        return req;
    }

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        // Set JWT properties via reflection for testing
        try {
            var secretField = JwtTokenProvider.class.getDeclaredField("jwtSecret");
            secretField.setAccessible(true);
            secretField.set(jwtTokenProvider, "TEST_SECRET_KEY_TEST_SECRET_KEY_32B");

            var expField = JwtTokenProvider.class.getDeclaredField("jwtExpiration");
            expField.setAccessible(true);
            expField.set(jwtTokenProvider, 86400000L);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        authService = new AuthService(userRepository, hocSinhRepository, passwordEncoder, jwtTokenProvider, refreshTokenRepository, tokenBlacklistRepository, tokenBlacklistCache, userAuditLogService);

        sampleUser = new User();
        sampleUser.setId(1);
        sampleUser.setUsername("admin");
        sampleUser.setPassword("$2a$10$hashedPassword");
        sampleUser.setRole(RoleEnum.ADMIN);
        sampleUser.setIsActive(true);
    }

    @Nested
    @DisplayName("login()")
    class Login {
        @Test
        @DisplayName("should return token and refreshToken on success")
        void returnsTokenOnSuccess() {
            LoginRequest request = loginRequest("admin", "password");

            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("password", "$2a$10$hashedPassword")).thenReturn(true);
            when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            LoginResponse result = authService.login(request);

            assertThat(result.getToken()).isNotBlank();
            assertThat(result.getRole()).isEqualTo("ADMIN");
            assertThat(result.getRefreshToken()).isNotBlank();
        }

        @Test
        @DisplayName("should throw on wrong password")
        void throwsOnWrongPassword() {
            LoginRequest request = loginRequest("admin", "wrong");

            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("wrong", "$2a$10$hashedPassword")).thenReturn(false);

            assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Sai tài khoản");
        }

        @Test
        @DisplayName("should throw on non-existent user")
        void throwsOnNonExistentUser() {
            LoginRequest request = loginRequest("nobody", "password");

            when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Sai tài khoản");
        }

        @Test
        @DisplayName("should throw on locked account")
        void throwsOnLockedAccount() {
            sampleUser.setIsActive(false);
            LoginRequest request = loginRequest("admin", "password");

            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("khóa");
        }
    }

    @Nested
    @DisplayName("refresh()")
    class Refresh {
        @Test
        @DisplayName("should return new tokens on valid refresh")
        void returnsNewTokensOnValidRefresh() {
            RefreshToken rt = new RefreshToken();
            rt.setToken("valid-refresh-token");
            rt.setUser(sampleUser);
            rt.setIsRevoked(false);
            rt.setExpiredAt(LocalDateTime.now().plusDays(7));

            when(refreshTokenRepository.findByToken("valid-refresh-token")).thenReturn(Optional.of(rt));
            when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            LoginResponse result = authService.refresh("valid-refresh-token");

            assertThat(result.getToken()).isNotBlank();
            assertThat(result.getRefreshToken()).isNotBlank();
            assertThat(rt.getIsRevoked()).isTrue();
        }

        @Test
        @DisplayName("should throw on expired refresh token")
        void throwsOnExpiredToken() {
            RefreshToken rt = new RefreshToken();
            rt.setToken("expired-token");
            rt.setUser(sampleUser);
            rt.setIsRevoked(false);
            rt.setExpiredAt(LocalDateTime.now().minusDays(1));

            when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(rt));

            assertThatThrownBy(() -> authService.refresh("expired-token"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("hết hạn");
        }

        @Test
        @DisplayName("should throw on revoked refresh token")
        void throwsOnRevokedToken() {
            RefreshToken rt = new RefreshToken();
            rt.setToken("revoked-token");
            rt.setUser(sampleUser);
            rt.setIsRevoked(true);
            rt.setExpiredAt(LocalDateTime.now().plusDays(7));

            when(refreshTokenRepository.findByToken("revoked-token")).thenReturn(Optional.of(rt));

            assertThatThrownBy(() -> authService.refresh("revoked-token"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("thu hồi");
        }
    }
}
