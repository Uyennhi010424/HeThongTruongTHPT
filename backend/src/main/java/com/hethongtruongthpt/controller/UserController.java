package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.user.ChangePasswordRequest;
import com.hethongtruongthpt.dto.user.UserDTO;
import com.hethongtruongthpt.dto.user.UserRequest;
import com.hethongtruongthpt.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<?>> getAll(
			@RequestParam(required = false) String username,
			@RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer size) {
		if (username != null && !username.isBlank()) {
			UserDTO user = userService.getByUsername(username.trim());
			return ResponseEntity.ok(ApiResponse.ok(user != null ? List.of(user) : List.of()));
		}
		if (page != null && size != null) {
			Page<UserDTO> result = userService.getAllPaged(page, size);
			return ResponseEntity.ok(ApiResponse.ok(result));
		}
		return ResponseEntity.ok(ApiResponse.ok(userService.getAll()));
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<UserDTO>> getById(@PathVariable("id") Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(userService.getById(id)));
	}

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<UserDTO>> create(@Valid @RequestBody UserRequest request) {
		return ResponseEntity.ok(ApiResponse.ok(userService.create(request)));
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<UserDTO>> update(
		    @PathVariable("id") Integer id,
			@Valid @RequestBody UserRequest request
	) {
		return ResponseEntity.ok(ApiResponse.ok(userService.update(id, request)));
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable("id") Integer id) {
		userService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}

	@PostMapping("/{id}/reset-password")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<Object>> resetPassword(@PathVariable("id") Integer id) {
		userService.resetPasswordToDefault(id);
		return ResponseEntity.ok(ApiResponse.ok("Đặt lại mật khẩu thành công", null));
	}

	@PostMapping("/{id}/change-password")
	public ResponseEntity<ApiResponse<Object>> changePassword(
			@PathVariable("id") Integer id,
			@Valid @RequestBody ChangePasswordRequest request
	) {
		org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
		boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
		String currentUsername = auth != null ? auth.getName() : null;

		UserDTO targetUser = userService.getById(id);
		if (targetUser == null) {
			throw new com.hethongtruongthpt.exception.ResourceNotFoundException("Không tìm thấy người dùng");
		}

		if (!isAdmin && !targetUser.getUsername().equals(currentUsername)) {
			throw new com.hethongtruongthpt.exception.ApiException("Bạn không có quyền đổi mật khẩu của người dùng khác.");
		}

		userService.changePassword(id, request.getOldPassword(), request.getNewPassword());
		return ResponseEntity.ok(ApiResponse.ok("Đổi mật khẩu thành công", null));
	}
}
