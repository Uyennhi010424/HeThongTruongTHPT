package com.hethongtruongthpt.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.hethongtruongthpt.repository.TokenBlacklistRepository;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Caffeine-backed cache for token blacklist lookups.
 * Avoids a DB round-trip on every authenticated request.
 */
@Service
public class TokenBlacklistCache {

    private final TokenBlacklistRepository tokenBlacklistRepository;

    // Cache blacklisted tokens for 5 minutes; non-blacklisted for 1 minute
    private final Cache<String, Boolean> blacklistCache = Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

    public TokenBlacklistCache(TokenBlacklistRepository tokenBlacklistRepository) {
        this.tokenBlacklistRepository = tokenBlacklistRepository;
    }

    public boolean isBlacklisted(String token) {
        Boolean cached = blacklistCache.getIfPresent(token);
        if (cached != null) {
            return cached;
        }
        boolean result = tokenBlacklistRepository.existsByToken(token);
        blacklistCache.put(token, result);
        return result;
    }

    /**
     * Mark a token as blacklisted in the cache immediately (called on logout).
     */
    public void markBlacklisted(String token) {
        blacklistCache.put(token, true);
    }

    /**
     * Invalidate cache entry (e.g., for admin token un-blacklist).
     */
    public void evict(String token) {
        blacklistCache.invalidate(token);
    }
}
