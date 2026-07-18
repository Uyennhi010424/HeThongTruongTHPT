package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.config.RateLimitConfig;
import com.hethongtruongthpt.dto.auth.LoginRequest;
import com.hethongtruongthpt.dto.auth.LoginResponse;
import com.hethongtruongthpt.dto.auth.RefreshRequest;
import com.hethongtruongthpt.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private final AuthService authService;
	private final RateLimitConfig rateLimitConfig;
	private final com.hethongtruongthpt.service.EmailResetPasswordService emailResetPasswordService;

	public AuthController(AuthService authService, RateLimitConfig rateLimitConfig, 
			com.hethongtruongthpt.service.EmailResetPasswordService emailResetPasswordService) {
		this.authService = authService;
		this.rateLimitConfig = rateLimitConfig;
		this.emailResetPasswordService = emailResetPasswordService;
	}

	@PostMapping("/login")
	public ResponseEntity<ApiResponse<LoginResponse>> login(
			@Valid @RequestBody LoginRequest request,
			HttpServletRequest httpRequest) {

		String clientIp = httpRequest.getRemoteAddr();
		String rateLimitKey = "login:" + clientIp + ":" + request.getUsername();

		if (!rateLimitConfig.isAllowed(rateLimitKey)) {
			return ResponseEntity.status(429)
					.body(ApiResponse.error("Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 1 phút."));
		}

		LoginResponse response = authService.login(request);
		return ResponseEntity.ok(ApiResponse.ok(response));
	}

	@PostMapping("/refresh")
	public ResponseEntity<ApiResponse<LoginResponse>> refresh(@Valid @RequestBody RefreshRequest body) {
		LoginResponse response = authService.refresh(body.getRefreshToken());
		return ResponseEntity.ok(ApiResponse.ok(response));
	}

	@PostMapping("/logout")
	public ResponseEntity<ApiResponse<String>> logout(HttpServletRequest httpRequest) {
		String authHeader = httpRequest.getHeader("Authorization");
		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			String token = authHeader.substring(7);
			authService.logout(token);
		}
		return ResponseEntity.ok(ApiResponse.ok("Đăng xuất thành công", null));
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<ApiResponse<Object>> forgotPassword(
			@Valid @RequestBody com.hethongtruongthpt.dto.auth.ForgotPasswordRequest request) {
		emailResetPasswordService.sendResetPasswordEmail(request.getUsername());
		return ResponseEntity.ok(ApiResponse.ok("Đã gửi email xác thực cấp lại mật khẩu. Vui lòng kiểm tra hòm thư của bạn.", null));
	}

	@PostMapping("/reset-password")
	public ResponseEntity<ApiResponse<Object>> resetPassword(
			@Valid @RequestBody com.hethongtruongthpt.dto.auth.ResetPasswordRequest request) {
		emailResetPasswordService.resetPassword(request.getToken(), request.getNewPassword());
		return ResponseEntity.ok(ApiResponse.ok("Mật khẩu của bạn đã được đặt lại thành công.", null));
	}
}
