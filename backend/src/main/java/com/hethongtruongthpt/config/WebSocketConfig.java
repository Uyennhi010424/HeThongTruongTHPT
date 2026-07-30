package com.hethongtruongthpt.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Kích hoạt simple broker cho các tiền tố này để gửi từ server tới client
        config.enableSimpleBroker("/topic", "/queue");
        // Tiền tố cho các tin nhắn được gửi từ client tới server (có thể map vào @MessageMapping)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Khai báo endpoint "/ws" và cấu hình CORS
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Ở production nên set URL cụ thể (vd: http://localhost:5173)
                .withSockJS(); // Fallback khi WebSocket không khả dụng
    }
}
