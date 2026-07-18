package com.hethongtruongthpt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class HethongtruongthptApplication {
    public static void main(String[] args) {
        SpringApplication.run(HethongtruongthptApplication.class, args);
    }
}
