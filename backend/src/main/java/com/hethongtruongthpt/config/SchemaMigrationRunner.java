package com.hethongtruongthpt.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class SchemaMigrationRunner {
    private static final Logger logger = LoggerFactory.getLogger(SchemaMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public SchemaMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void migrate() {
        addColumnIfMissing("hoc_sinh", "dan_toc", "ALTER TABLE hoc_sinh ADD COLUMN dan_toc VARCHAR(100) NULL");
        addColumnIfMissing("hoc_sinh", "ton_giao", "ALTER TABLE hoc_sinh ADD COLUMN ton_giao VARCHAR(100) NULL");
    }

    private void addColumnIfMissing(String tableName, String columnName, String alterSql) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                    Integer.class,
                    tableName,
                    columnName
            );

            if (count != null && count > 0) {
                logger.info("Schema migration skipped, column exists: {}.{}", tableName, columnName);
                return;
            }

            jdbcTemplate.execute(alterSql);
            logger.info("Schema migration applied: {}", alterSql);
        } catch (Exception ex) {
            logger.warn("Schema migration skipped or failed for {}.{}", tableName, columnName, ex);
        }
    }
}
