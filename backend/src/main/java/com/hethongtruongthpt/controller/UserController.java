package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.user.UserDTO;
import com.hethongtruongthpt.dto.user.UserRequest;
import com.hethongtruongthpt.service.UserService;
import org.springframework.http.ResponseEntity;
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
	public ResponseEntity<ApiResponse<List<UserDTO>>> getAll() {
		return ResponseEntity.ok(ApiResponse.ok(userService.getAll()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<UserDTO>> getById(@PathVariable("id") Long id) {
		return ResponseEntity.ok(ApiResponse.ok(userService.getById(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<UserDTO>> create(@RequestBody UserRequest request) {
		return ResponseEntity.ok(ApiResponse.ok(userService.create(request)));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<UserDTO>> update(
		    @PathVariable("id") Long id,
			@RequestBody UserRequest request
	) {
		return ResponseEntity.ok(ApiResponse.ok(userService.update(id, request)));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable("id") Long id) {
		userService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}
}
