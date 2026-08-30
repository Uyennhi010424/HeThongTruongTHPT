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
                    int updated = jdbcTemplate.update("UPDATE " + table + " SET is_deleted = false WHERE is_deleted IS NULL");
                    if (updated > 0) {
                        log.info("Initialized {} rows in table '{}' with is_deleted = false", updated, table);
                    }
                    if ("thoi_khoa_bieu".equals(table)) {
                        int deleted = jdbcTemplate.update("DELETE FROM thoi_khoa_bieu WHERE is_deleted = true");
                        if (deleted > 0) {
                            log.info("Hard deleted {} soft-deleted rows in table 'thoi_khoa_bieu' to prevent unique constraint conflicts", deleted);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Could not update table '{}': {}", table, e.getMessage());
                }
            }
            log.info("Soft delete initialization complete.");
        };
    }
}
