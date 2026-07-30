package com.hethongtruongthpt.service;

import com.hethongtruongthpt.repository.AiSuggestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AiCleanupTask {
    
    private static final Logger logger = LoggerFactory.getLogger(AiCleanupTask.class);
    private final AiSuggestionRepository aiSuggestionRepository;

    public AiCleanupTask(AiSuggestionRepository aiSuggestionRepository) {
        this.aiSuggestionRepository = aiSuggestionRepository;
    }

    @Scheduled(cron = "0 0 0 * * ?") // Chạy vào lúc 00:00 mỗi ngày
    @Transactional
    public void cleanExpiredAiSuggestions() {
        logger.info("Starting AI Suggestion cleanup task...");
        try {
            aiSuggestionRepository.deleteByHetHanBefore(LocalDateTime.now());
            logger.info("Successfully cleaned up expired AI suggestions.");
        } catch (Exception e) {
            logger.error("Error occurred while cleaning expired AI suggestions: ", e);
        }
    }
}
