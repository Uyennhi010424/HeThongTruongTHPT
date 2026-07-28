package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.AppNotification;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.repository.AppNotificationRepository;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.enums.RoleEnum;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LeaveNotificationService {

    private final AppNotificationRepository notificationRepo;
    private final UserRepository userRepo;

    public LeaveNotificationService(AppNotificationRepository notificationRepo, UserRepository userRepo) {
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public void sendToUser(User user, String title, String message, String type, Integer referenceId) {
        AppNotification n = new AppNotification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setReferenceId(referenceId);
        n.setIsRead(false);
        notificationRepo.save(n);
    }

    @Transactional
    public void sendToAllAdmins(String title, String message, String type, Integer referenceId) {
        List<User> admins = userRepo.findByRole(RoleEnum.ADMIN);
        for (User admin : admins) {
            sendToUser(admin, title, message, type, referenceId);
        }
    }

    @Transactional(readOnly = true)
    public List<AppNotification> getForUser(Integer userId) {
        return notificationRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public int countUnread(Integer userId) {
        return notificationRepo.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markRead(Integer notificationId) {
        notificationRepo.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepo.save(n);
        });
    }

    @Transactional
    public void markAllRead(Integer userId) {
        List<AppNotification> all = notificationRepo.findByUserIdOrderByCreatedAtDesc(userId);
        all.stream().filter(n -> !Boolean.TRUE.equals(n.getIsRead())).forEach(n -> {
            n.setIsRead(true);
            notificationRepo.save(n);
        });
    }
}
