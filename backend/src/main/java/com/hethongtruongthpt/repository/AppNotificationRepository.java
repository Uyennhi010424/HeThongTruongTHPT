package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, Integer> {
    List<AppNotification> findByUserIdOrderByCreatedAtDesc(Integer userId);
    int countByUserIdAndIsReadFalse(Integer userId);
}
