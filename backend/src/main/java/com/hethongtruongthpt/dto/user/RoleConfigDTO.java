package com.hethongtruongthpt.dto.user;

public class RoleConfigDTO {
    private String role;
    private String permissions;

    public RoleConfigDTO() {}

    public RoleConfigDTO(String role, String permissions) {
        this.role = role;
        this.permissions = permissions;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPermissions() {
        return permissions;
    }

    public void setPermissions(String permissions) {
        this.permissions = permissions;
    }
}
