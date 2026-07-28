package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.AppNotification;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.service.LeaveNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final LeaveNotificationService leaveNotificationService;
    private final UserRepository userRepository;

    public NotificationController(LeaveNotificationService leaveNotificationService, UserRepository userRepository) {
        this.leaveNotificationService = leaveNotificationService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<ApiResponse<List<AppNotification>>> getMyNotifications() {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(leaveNotificationService.getForUser(currentUser.getId())));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getUnreadCount() {
        User currentUser = getCurrentUser();
        int count = leaveNotificationService.countUnread(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", count)));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Object>> markRead(@PathVariable Integer id) {
        leaveNotificationService.markRead(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu đọc", null));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Object>> markAllRead() {
        User currentUser = getCurrentUser();
        leaveNotificationService.markAllRead(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu tất cả đọc", null));
    }
}
