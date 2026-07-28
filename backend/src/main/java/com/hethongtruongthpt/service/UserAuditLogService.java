package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.user.UserAuditLogDTO;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.entity.UserAuditLog;
import com.hethongtruongthpt.repository.UserAuditLogRepository;
import com.hethongtruongthpt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserAuditLogService {

    private final UserAuditLogRepository userAuditLogRepository;
    private final UserRepository userRepository;

    public UserAuditLogService(UserAuditLogRepository userAuditLogRepository, UserRepository userRepository) {
        this.userAuditLogRepository = userAuditLogRepository;
        this.userRepository = userRepository;
    }

    public void logAction(Integer userId, String action, String details, String ipAddress) {
        if (userId == null) return;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        UserAuditLog log = new UserAuditLog();
        log.setUser(user);
        log.setAction(action);
        log.setDetails(details);
        log.setIpAddress(ipAddress);
        userAuditLogRepository.save(log);
    }

    public List<UserAuditLogDTO> getUserLogs(Integer userId) {
        return userAuditLogRepository.findByUserIdOrderByTimestampDesc(userId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private UserAuditLogDTO toDto(UserAuditLog log) {
        UserAuditLogDTO dto = new UserAuditLogDTO();
        dto.setId(log.getId());
        dto.setUserId(log.getUser().getId());
        dto.setAction(log.getAction());
        dto.setDetails(log.getDetails());
        dto.setIpAddress(log.getIpAddress());
        dto.setTimestamp(log.getTimestamp());
        return dto;
    }
}
