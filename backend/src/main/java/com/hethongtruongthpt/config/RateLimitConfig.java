package com.hethongtruongthpt.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitConfig {

    private static final int MAX_ATTEMPTS = 30;
    private static final long WINDOW_MS = 60_000; // 1 minute

    // Auto-evict entries after 2 minutes of no access (TTL = window + buffer)
    private final Cache<String, AttemptWindow> attempts = Caffeine.newBuilder()
            .expireAfterAccess(2, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

    public boolean isAllowed(String key) {
        AttemptWindow window = attempts.get(key, k -> new AttemptWindow());
        // Reset window if expired
        if (System.currentTimeMillis() - window.start > WINDOW_MS) {
            AttemptWindow fresh = new AttemptWindow();
            attempts.put(key, fresh);
            return fresh.count.incrementAndGet() <= MAX_ATTEMPTS;
        }
        return window.count.incrementAndGet() <= MAX_ATTEMPTS;
    }

    public int getRemainingAttempts(String key) {
        AttemptWindow window = attempts.getIfPresent(key);
        if (window == null || System.currentTimeMillis() - window.start > WINDOW_MS) {
            return MAX_ATTEMPTS;
        }
        return Math.max(0, MAX_ATTEMPTS - window.count.get());
    }

    private static class AttemptWindow {
        final long start = System.currentTimeMillis();
        final AtomicInteger count = new AtomicInteger(0);
    }
}
