package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.AppNotification;
import com.hethongtruongthpt.entity.ThongBao;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.repository.AppNotificationRepository;
import com.hethongtruongthpt.repository.ThongBaoRepository;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.enums.RoleEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LeaveNotificationService {

    private static final Logger log = LoggerFactory.getLogger(LeaveNotificationService.class);

    private final AppNotificationRepository notificationRepo;
    private final UserRepository userRepo;
    private final ThongBaoRepository thongBaoRepo;
    private final SimpMessagingTemplate messagingTemplate;

    public LeaveNotificationService(AppNotificationRepository notificationRepo,
                                    UserRepository userRepo,
                                    ThongBaoRepository thongBaoRepo,
                                    SimpMessagingTemplate messagingTemplate) {
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
        this.thongBaoRepo = thongBaoRepo;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public void sendToUser(User user, String title, String message, String type, Integer referenceId) {
        if (user == null) return;

        // 1. Save AppNotification (for Bell icon / real-time popup)
        AppNotification n = new AppNotification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setReferenceId(referenceId);
        n.setIsRead(false);
        AppNotification savedAppNotif = notificationRepo.save(n);

        // 2. Also save ThongBao record (so it appears in Teacher's ThongBao inbox/announcements)
        try {
            ThongBao tb = new ThongBao();
            tb.setTieuDe(title);
            tb.setNoiDung(message);
            tb.setLoai("GIAO_VIEN");
            tb.setRecipientId(user.getId());
            tb.setSenderRole("ADMIN");
            tb.setNgayDang(LocalDateTime.now());
            tb.setTrangThai(1);
            thongBaoRepo.save(tb);
        } catch (Exception e) {
            log.warn("Failed to create ThongBao mirror: {}", e.getMessage());
        }

        // 3. Push real-time via WebSocket only to target user
        try {
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/user/" + user.getId(), savedAppNotif);
            }
        } catch (Exception e) {
            log.warn("Failed to broadcast notification via WebSocket: {}", e.getMessage());
        }
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
