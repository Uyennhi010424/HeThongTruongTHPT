package com.hethongtruongthpt.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseFixer {

    @Bean
    public CommandLineRunner fixDatabaseSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Sửa lại cột nguoi_tao_id cho phép NULL (do Hibernate ddl-auto update không tự đổi cột từ NOT NULL sang NULL)
                jdbcTemplate.execute("ALTER TABLE thong_bao MODIFY nguoi_tao_id INT NULL");
                System.out.println("[DatabaseFixer] Đã sửa cột thong_bao.nguoi_tao_id thành NULL thành công.");
            } catch (Exception e) {
                System.out.println("[DatabaseFixer] Không thể sửa cột thong_bao.nguoi_tao_id (có thể đã được sửa hoặc không có quyền): " + e.getMessage());
            }
        };
    }
}
