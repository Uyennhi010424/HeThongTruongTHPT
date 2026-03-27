package com.hethongtruongthpt.controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class test {
       @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
            "status", "UP",
            "message", "Backend is running"
        );
    }
}
