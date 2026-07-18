package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.RefreshToken;
import com.hethongtruongthpt.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken> findByUserId(Integer userId);
    List<RefreshToken> findByUserIdAndIsRevokedFalse(Integer userId);
    List<RefreshToken> findByExpiredAtLessThan(LocalDateTime now);
    List<RefreshToken> findByIsRevokedFalseAndExpiredAtAfter(LocalDateTime now);
    void deleteByUser(User user);
}
