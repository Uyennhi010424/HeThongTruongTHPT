package com.hethongtruongthpt.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertiesPropertySource;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;

/**
 * Tự động load file .env từ thư mục gốc dự án vào Spring Environment.
 * Áp dụng khi chạy backend trực tiếp (không qua Docker).
 */
public class DotenvConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(@org.springframework.lang.NonNull ConfigurableApplicationContext applicationContext) {
        try {
            // Tìm file .env từ thư mục gốc dự án (cha của backend/)
            Path projectRoot = Paths.get(System.getProperty("user.dir")).getParent();
            if (projectRoot == null) return;

            Dotenv dotenv = Dotenv.configure()
                    .directory(projectRoot.toString())
                    .ignoreIfMissing()
                    .load();

            Properties props = new Properties();
            dotenv.entries().forEach(entry -> props.setProperty(entry.getKey(), entry.getValue()));

            ConfigurableEnvironment env = applicationContext.getEnvironment();
            env.getPropertySources().addFirst(new PropertiesPropertySource("dotenv", props));
        } catch (Exception e) {
            // Không crash nếu .env không tồn tại (Docker sẽ set env trực tiếp)
        }
    }
}
