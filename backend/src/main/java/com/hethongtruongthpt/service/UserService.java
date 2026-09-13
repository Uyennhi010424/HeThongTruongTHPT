package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.user.UserDTO;
import com.hethongtruongthpt.dto.user.UserRequest;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.util.DefaultAccountPasswordPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.hethongtruongthpt.exception.ApiException;
import org.springframework.transaction.annotation.Transactional;

import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.PhuHuynhRepository;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private static final String UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final String SPECIAL = "@#$!";
    private static final String ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SPECIAL;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DefaultAccountPasswordPolicy passwordPolicy;
    private final UserAuditLogService auditLogService;
    private final EmailResetPasswordService emailResetPasswordService;
    private final GiaoVienRepository giaoVienRepository;
    private final HocSinhRepository hocSinhRepository;
    private final PhuHuynhRepository phuHuynhRepository;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @org.springframework.context.annotation.Lazy DefaultAccountPasswordPolicy passwordPolicy,
            UserAuditLogService auditLogService,
            EmailResetPasswordService emailResetPasswordService,
            GiaoVienRepository giaoVienRepository,
            HocSinhRepository hocSinhRepository,
            PhuHuynhRepository phuHuynhRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.auditLogService = auditLogService;
        this.emailResetPasswordService = emailResetPasswordService;
        this.giaoVienRepository = giaoVienRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.phuHuynhRepository = phuHuynhRepository;
    }

    public String generateRandomPassword(int length) {
        if (length < 8) length = 8;
        List<Character> chars = new ArrayList<>();
        chars.add(UPPERCASE.charAt(RANDOM.nextInt(UPPERCASE.length())));
        chars.add(LOWERCASE.charAt(RANDOM.nextInt(LOWERCASE.length())));
        chars.add(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));
        chars.add(SPECIAL.charAt(RANDOM.nextInt(SPECIAL.length())));

        for (int i = 4; i < length; i++) {
            chars.add(ALL_CHARS.charAt(RANDOM.nextInt(ALL_CHARS.length())));
        }

        Collections.shuffle(chars, RANDOM);
        StringBuilder sb = new StringBuilder();
        for (char c : chars) {
            sb.append(c);
        }
        return sb.toString();
    }

    public String resetPasswordToDefault(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        try {
            User existing = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
            String newRaw = generateRandomPassword(8);
            existing.setPassword(passwordEncoder.encode(newRaw));
            existing.setMustChangePassword(true);
            userRepository.save(existing);
            auditLogService.logAction(existing.getId(), "RESET_PASSWORD", "Cấp lại mật khẩu ngẫu nhiên mới", null);

            // Gửi email thông báo mật khẩu mới
            String recipientEmail = resolveUserEmail(existing);
            if (recipientEmail != null && !recipientEmail.isBlank()) {
                emailResetPasswordService.sendAdminResetPasswordNotification(existing, newRaw, recipientEmail);
            } else {
                log.warn("Tài khoản {} (id: {}) không có email hợp lệ để gửi thông báo mật khẩu mới", existing.getUsername(), existing.getId());
            }
            return newRaw;
        } catch (Exception ex) {
            throw new ApiException("Không thể đặt lại mật khẩu: " + ex.getMessage());
        }
    }

    private String resolveUserEmail(User user) {
        if (user == null) return null;
        if (user.getEmail() != null && user.getEmail().contains("@")) {
            return user.getEmail().trim();
        }
        if (user.getUsername() != null && user.getUsername().contains("@")) {
            return user.getUsername().trim();
        }
        if (user.getId() != null) {
            if (user.getRole() == RoleEnum.GIAO_VIEN) {
                var gv = giaoVienRepository.findByUserId(user.getId());
                if (gv.isPresent() && gv.get().getEmail() != null && gv.get().getEmail().contains("@")) {
                    return gv.get().getEmail().trim();
                }
            } else if (user.getRole() == RoleEnum.HOC_SINH) {
                var hs = hocSinhRepository.findByUserId(user.getId());
                if (hs.isPresent() && hs.get().getEmail() != null && hs.get().getEmail().contains("@")) {
                    return hs.get().getEmail().trim();
                }
            } else if (user.getRole() == RoleEnum.PHU_HUYNH) {
                var ph = phuHuynhRepository.findByUserId(user.getId());
                if (ph.isPresent() && ph.get().getEmail() != null && ph.get().getEmail().contains("@")) {
                    return ph.get().getEmail().trim();
                }
            }
        }
        return null;
    }

    public static void validatePasswordStrength(String password) {
        if (password == null || password.isBlank()) {
            throw new ApiException("Mật khẩu mới không được để trống");
        }
        if (password.length() < 8 || password.length() > 100) {
            throw new ApiException("Mật khẩu mới phải có độ dài từ 8 đến 100 ký tự");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new ApiException("Mật khẩu mới phải chứa ít nhất 1 chữ cái in hoa (A-Z)");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new ApiException("Mật khẩu mới phải chứa ít nhất 1 chữ cái in thường (a-z)");
        }
        if (!password.matches(".*\\d.*")) {
            throw new ApiException("Mật khẩu mới phải chứa ít nhất 1 chữ số (0-9)");
        }
        if (!password.matches(".*[^A-Za-z0-9].*")) {
            throw new ApiException("Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: @, #, $, !, %,...)");
        }
    }

    public void changePassword(Integer id, String oldPassword, String newPassword) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        if (oldPassword == null || oldPassword.isBlank()) {
            throw new ApiException("Mật khẩu cũ không được để trống");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new ApiException("Mật khẩu mới không được để trống");
        }
        if (oldPassword.trim().equals(newPassword.trim())) {
            throw new ApiException("Mật khẩu mới không được trùng với mật khẩu cũ");
        }

        validatePasswordStrength(newPassword.trim());

        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));

        String storedPassword = existing.getPassword();
        boolean isBcrypt = storedPassword != null && storedPassword.matches("^\\$2[aby]\\$\\d{2}\\$.+");

        if (!isBcrypt) {
            if (!storedPassword.equals(oldPassword.trim())) {
                throw new ApiException("Mật khẩu cũ không chính xác");
            }
        } else {
            if (!passwordEncoder.matches(oldPassword.trim(), storedPassword)) {
                throw new ApiException("Mật khẩu cũ không chính xác");
            }
        }

        existing.setPassword(passwordEncoder.encode(newPassword.trim()));
        existing.setMustChangePassword(false);
        userRepository.save(existing);
        auditLogService.logAction(existing.getId(), "CHANGE_PASSWORD", "Người dùng tự đổi mật khẩu", null);
    }

    public List<UserDTO> getAll() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Page<UserDTO> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("username").ascending());
        return userRepository.findAll(pageable).map(this::toDto);
    }

    public UserDTO getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        return toDto(user);
    }

    public UserDTO getByUsername(String username) {
        if (username == null || username.isBlank()) return null;
        return userRepository.findByUsername(username.trim())
                .map(this::toDto)
                .orElse(null);
    }

    private static final java.util.regex.Pattern USERNAME_PATTERN =
            java.util.regex.Pattern.compile("^[a-zA-Z0-9._-]+(@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})?$");
    private static final java.util.regex.Pattern USER_EMAIL_PATTERN =
            java.util.regex.Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private void validateUserInfo(String username, String email) {
        if (username == null || username.isBlank()) {
            throw new ApiException("Tên đăng nhập không được để trống");
        }
        String trimmedUser = username.trim();
        if (!USERNAME_PATTERN.matcher(trimmedUser).matches()) {
            throw new ApiException("Tên đăng nhập chỉ được chứa chữ cái, chữ số, dấu chấm, gạch ngang, gạch dưới hoặc là địa chỉ email hợp lệ");
        }
        if (email != null && !email.isBlank()) {
            if (!USER_EMAIL_PATTERN.matcher(email.trim()).matches()) {
                throw new ApiException("Email không đúng định dạng");
            }
        }
    }

    public UserDTO create(UserRequest request) {
        String username = request.getUsername() == null ? null : request.getUsername().trim();
        validateUserInfo(username, request.getEmail());

        if (userRepository.findByUsername(username).isPresent()) {
            // Reuse existing account to keep import flow idempotent.
            return toDto(userRepository.findByUsername(username).get());
        }

        User user = new User();
        user.setUsername(username);
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail().trim());
        }

        // Generate default password server-side when none is provided
        String rawPassword = request.getPassword();
        if (rawPassword == null || rawPassword.isBlank()) {
            RoleEnum role = resolveRole(request.getRole());
            if (role == RoleEnum.GIAO_VIEN) {
                rawPassword = passwordPolicy.getTeacherDefaultPassword(username);
            } else {
                rawPassword = passwordPolicy.getStudentDefaultPassword();
            }
        }
        user.setPassword(normalizePassword(rawPassword));

        user.setRole(resolveRole(request.getRole()));
        user.setIsActive(resolveActive(request.getStatus()));
        user.setMustChangePassword(true);
        User saved = userRepository.save(user);
        return toDto(saved);
    }

    public UserDTO update(Integer id, UserRequest request) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));

        if (request.getUsername() != null) {
            validateUserInfo(request.getUsername(), request.getEmail());
            existing.setUsername(request.getUsername().trim());
        }
        if (request.getEmail() != null) {
            if (!request.getEmail().isBlank() && !USER_EMAIL_PATTERN.matcher(request.getEmail().trim()).matches()) {
                throw new ApiException("Email không đúng định dạng");
            }
            existing.setEmail(request.getEmail().trim());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            existing.setPassword(normalizePassword(request.getPassword()));
        }
        if (request.getRole() != null && !request.getRole().isBlank()) {
            existing.setRole(resolveRole(request.getRole()));
        }
        if (request.getStatus() != null) {
            existing.setIsActive(resolveActive(request.getStatus()));
        }
        if (request.getAnhDaiDien() != null) {
            existing.setAnhDaiDien(request.getAnhDaiDien());
        }

        User saved = userRepository.save(existing);
        return toDto(saved);
    }

    public void updatePermissions(Integer id, String permissionsStr) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        existing.setPermissions(permissionsStr);
        userRepository.save(existing);
        auditLogService.logAction(id, "UPDATE_PERMISSIONS", "Cập nhật quyền truy cập hệ thống", null);
    }

    public void lockAccount(Integer id, java.time.LocalDateTime lockedUntil) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        
        existing.setLockedUntil(lockedUntil);
        
        if (lockedUntil != null) {
            existing.setIsActive(false);
            String detail = lockedUntil.getYear() >= 2099 ? "Khóa vĩnh viễn" : "Khóa tạm thời đến " + lockedUntil.toString();
            auditLogService.logAction(id, "LOCK_ACCOUNT", detail, null);
        } else {
            existing.setIsActive(true);
            auditLogService.logAction(id, "UNLOCK_ACCOUNT", "Mở khóa tài khoản", null);
        }
        
        userRepository.save(existing);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        userRepository.deleteById(id);
    }

    private String normalizePassword(String rawPassword) {
        if (rawPassword == null) {
            return null;
        }
        String trimmed = rawPassword.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.matches("^\\$2[aby]\\$\\d{2}\\$.+")) {
            return trimmed;
        }
        return passwordEncoder.encode(trimmed);
    }

    private RoleEnum resolveRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return null;
        }
        String raw = roleName.trim().toUpperCase();
        try {
            return RoleEnum.valueOf(raw);
        } catch (IllegalArgumentException ex) {
            log.debug("Role '{}' không khớp enum trực tiếp, thử parse mở rộng", raw);
        }

        // Accept frontend variants like "GIAOVIEN", "HOCSINH", "PHUHUYNH", "VAN_THU", etc.
        String cleaned = raw.replaceAll("[^A-Z0-9]", "");
        switch (cleaned) {
            case "GIAOVIEN":
                return RoleEnum.GIAO_VIEN;
            case "HOCSINH":
                return RoleEnum.HOC_SINH;
            case "PHUHUYNH":
                return RoleEnum.PHU_HUYNH;
            case "VANTHU":
                return RoleEnum.VAN_THU;
            case "ADMIN":
                return RoleEnum.ADMIN;
            default:
                throw new IllegalArgumentException("Unknown role: " + roleName);
        }
    }

    private boolean resolveActive(Integer status) {
        return status == null || status == 1;
    }

    private UserDTO toDto(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setActive(user.getIsActive());
        dto.setStatus(Boolean.TRUE.equals(user.getIsActive()) ? 1 : 0);
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setLastLogin(user.getLastLogin());
        dto.setLockedUntil(user.getLockedUntil());
        dto.setPermissions(user.getPermissions());
        dto.setAnhDaiDien(user.getAnhDaiDien());
        return dto;
    }
}
