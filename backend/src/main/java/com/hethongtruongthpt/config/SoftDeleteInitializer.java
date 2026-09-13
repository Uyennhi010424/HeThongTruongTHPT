package com.hethongtruongthpt.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SoftDeleteInitializer {

    private static final Logger log = LoggerFactory.getLogger(SoftDeleteInitializer.class);

    @Bean
    public CommandLineRunner initSoftDelete(JdbcTemplate jdbcTemplate) {
        return args -> {
            log.info("Checking and initializing is_deleted flags for existing data...");
            String[] tables = {"giao_vien", "lop", "mon_hoc", "phu_huynh", "thoi_khoa_bieu"};
            
            for (String table : tables) {
                try {
                    int deleted = jdbcTemplate.update("DELETE FROM " + table + " WHERE is_deleted = true");
                    if (deleted > 0) {
                        log.info("Purged {} soft-deleted rows in table '{}'", deleted, table);
                    }
                } catch (Exception e) {
                    log.warn("Could not purge soft-deleted records in table '{}': {}", table, e.getMessage());
                }
            }
            log.info("Database cleanup complete.");
        };
    }
}
