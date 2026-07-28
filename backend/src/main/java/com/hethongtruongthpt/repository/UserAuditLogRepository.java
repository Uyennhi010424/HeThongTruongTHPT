package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.UserAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserAuditLogRepository extends JpaRepository<UserAuditLog, Integer> {
    List<UserAuditLog> findByUserIdOrderByTimestampDesc(Integer userId);

    @Query("SELECT u FROM UserAuditLog u WHERE " +
           "(:userId IS NULL OR u.user.id = :userId) AND " +
           "(cast(:startDate as timestamp) IS NULL OR u.timestamp >= :startDate) AND " +
           "(cast(:endDate as timestamp) IS NULL OR u.timestamp <= :endDate) " +
           "ORDER BY u.timestamp DESC")
    List<UserAuditLog> findFiltered(@Param("userId") Integer userId, 
                                    @Param("startDate") LocalDateTime startDate, 
                                    @Param("endDate") LocalDateTime endDate);
}
