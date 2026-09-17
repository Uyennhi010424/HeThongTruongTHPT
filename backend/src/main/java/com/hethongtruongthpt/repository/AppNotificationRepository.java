package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, Integer> {
    @Query("SELECT a FROM AppNotification a WHERE a.user.id = :userId ORDER BY a.createdAt DESC")
    List<AppNotification> findByUserIdOrderByCreatedAtDesc(@Param("userId") Integer userId);

    @Query("SELECT COUNT(a) FROM AppNotification a WHERE a.user.id = :userId AND (a.isRead = false OR a.isRead IS NULL)")
    int countByUserIdAndIsReadFalse(@Param("userId") Integer userId);
}
