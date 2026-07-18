package com.hethongtruongthpt.config;

import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.service.TokenBlacklistCache;
import jakarta.servlet.FilterChain;
import org.springframework.lang.NonNull;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistCache tokenBlacklistCache;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, TokenBlacklistCache tokenBlacklistCache, UserRepository userRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.tokenBlacklistCache = tokenBlacklistCache;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String requestUri = request.getRequestURI();

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (!jwtTokenProvider.validateToken(token)) {
                    log.warn("JWT không hợp lệ cho request: {} {}", request.getMethod(), requestUri);
                } else if (tokenBlacklistCache.isBlacklisted(token)) {
                    log.warn("JWT đã bị blacklist cho request: {} {}", request.getMethod(), requestUri);
                } else {
                    String username = jwtTokenProvider.getUsernameFromToken(token);
                    String role = jwtTokenProvider.getRoleFromToken(token);

                    // Verify user still exists and is active
                    Optional<User> userOpt = userRepository.findByUsername(username);
                    if (userOpt.isEmpty() || !Boolean.TRUE.equals(userOpt.get().getIsActive())) {
                        log.warn("User '{}' không tồn tại hoặc đã bị vô hiệu hóa", username);
                        filterChain.doFilter(request, response);
                        return;
                    }

                    List<SimpleGrantedAuthority> authorities = role != null && !role.isBlank()
                            ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                            : List.of();

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(username, null, authorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.debug("JWT hợp lệ: user={}, role={}, path={}", username, role, requestUri);
                }
            } catch (Exception ex) {
                log.warn("Lỗi xác thực JWT: {} — {} {}", ex.getMessage(), request.getMethod(), requestUri);
            }
        }

        filterChain.doFilter(request, response);
    }
}
