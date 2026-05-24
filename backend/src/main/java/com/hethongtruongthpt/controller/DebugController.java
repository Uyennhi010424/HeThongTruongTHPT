package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/debug")
public class DebugController {
    private final UserRepository userRepository;

    public DebugController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/user-info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> userInfo(@RequestParam String username) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("username", user.getUsername());
                    m.put("passwordHash", user.getPassword());
                    m.put("role", user.getRole());
                    m.put("isActive", user.getIsActive());
                    m.put("isBcrypt", user.getPassword() != null && user.getPassword().matches("^\\$2[aby]\\$\\d{2}\\$.+"));
                    return ResponseEntity.ok(ApiResponse.ok(m));
                })
                .orElse(ResponseEntity.ok(ApiResponse.error("User not found")));
    }

    @PostMapping("/verify-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPassword(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        return userRepository.findByUsername(username)
                .map(user -> {
                    Map<String, Object> m = new HashMap<>();
                    boolean matches = false;
                    try {
                        org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder enc = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
                        String stored = user.getPassword();
                        if (stored != null && stored.matches("^\\$2[aby]\\$\\d{2}\\$.+")) {
                            matches = enc.matches(password, stored);
                        } else if (stored != null) {
                            matches = password.equals(stored);
                        }
                    } catch (Exception ignored) {}
                    m.put("username", user.getUsername());
                    m.put("matches", matches);
                    return ResponseEntity.ok(ApiResponse.ok(m));
                })
                .orElse(ResponseEntity.ok(ApiResponse.error("User not found")));
    }
}
