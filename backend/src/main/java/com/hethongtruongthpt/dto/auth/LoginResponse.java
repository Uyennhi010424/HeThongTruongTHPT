package com.hethongtruongthpt.dto.auth;

public class LoginResponse {
    private String token;
    private String refreshToken;
    private String role;
    private boolean mustChangePassword;

    public LoginResponse() {
    }

    public LoginResponse(String token, String refreshToken, String role, boolean mustChangePassword) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.role = role;
        this.mustChangePassword = mustChangePassword;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public boolean isMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }
}
