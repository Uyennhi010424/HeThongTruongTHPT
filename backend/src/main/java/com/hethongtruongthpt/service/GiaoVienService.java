package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.user.UserRequest;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@Transactional
public class GiaoVienService {
    private static final String DEFAULT_ACCOUNT_SUFFIX = "c3@tdn.edu.vn";
    private static final String DEFAULT_ACCOUNT_PASSWORD = "Abc1234@";
    private static final Pattern MOJIBAKE_PATTERN = Pattern.compile("(Ã|Â|á»|áº|Ä|Å|ð|ñ|ß)");

    private final GiaoVienRepository giaoVienRepository;
    private final UserService userService;
    private final UserRepository userRepository;

    public GiaoVienService(
            GiaoVienRepository giaoVienRepository,
            UserService userService,
            UserRepository userRepository
    ) {
        this.giaoVienRepository = giaoVienRepository;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    public List<GiaoVien> getAll() {
        return giaoVienRepository.findAll().stream()
                .map(this::sanitizeVietnameseText)
                .toList();
    }

    public GiaoVien getById(Integer id) {
        GiaoVien giaoVien = giaoVienRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên"));
        return sanitizeVietnameseText(giaoVien);
    }

    public GiaoVien create(GiaoVien giaoVien) {
        if (giaoVien.getHoTen() == null || giaoVien.getHoTen().isBlank()) {
            throw new ApiException("Thiếu họ tên giáo viên");
        }

        String generatedUsername = generateUniqueUsername(giaoVien.getHoTen());
        String username = (giaoVien.getEmail() == null || giaoVien.getEmail().isBlank())
                ? generatedUsername
                : giaoVien.getEmail().trim();

        giaoVien.setEmail(username);
        if (giaoVien.getUser() == null || giaoVien.getUser().getId() == null) {
            giaoVien.setUser(ensureTeacherAccountExists(username));
        }
        if (giaoVien.getMaGiaoVien() == null || giaoVien.getMaGiaoVien().isBlank()) {
            giaoVien.setMaGiaoVien(generateUniqueTeacherCode());
        }

        GiaoVien saved = giaoVienRepository.save(giaoVien);
        return sanitizeVietnameseText(saved);
    }

    public GiaoVien update(Integer id, GiaoVien giaoVien) {
        GiaoVien existing = giaoVienRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên"));

        if (giaoVien.getHoTen() != null) {
            existing.setHoTen(giaoVien.getHoTen());
        }
        existing.setNgaySinh(giaoVien.getNgaySinh());
        existing.setDiaChi(giaoVien.getDiaChi());
        existing.setSoDienThoai(giaoVien.getSoDienThoai());
        existing.setGioiTinh(giaoVien.getGioiTinh());
        existing.setBoMon(giaoVien.getBoMon());
        existing.setTrinhDo(giaoVien.getTrinhDo());

        String username = giaoVien.getEmail();
        if (username == null || username.isBlank()) {
            username = existing.getEmail();
        }
        if (username == null || username.isBlank()) {
            username = generateUniqueUsername(existing.getHoTen());
        }
        username = username.trim();
        existing.setEmail(username);

        if (existing.getUser() == null || existing.getUser().getId() == null) {
            existing.setUser(ensureTeacherAccountExists(username));
        }
        if (existing.getMaGiaoVien() == null || existing.getMaGiaoVien().isBlank()) {
            existing.setMaGiaoVien(generateUniqueTeacherCode());
        }

        GiaoVien saved = giaoVienRepository.save(existing);
        return sanitizeVietnameseText(saved);
    }

    public void delete(Integer id) {
        giaoVienRepository.deleteById(id);
    }

    public void syncMissingTeacherAccounts() {
        List<GiaoVien> teachers = giaoVienRepository.findAll();
        for (GiaoVien teacher : teachers) {
            if (teacher == null) continue;

            String email = teacher.getEmail();
            if (email == null || email.isBlank()) {
                email = generateUniqueUsername(teacher.getHoTen());
                teacher.setEmail(email);
                giaoVienRepository.save(teacher);
            }
            ensureTeacherAccountExists(email);
        }
    }

    private GiaoVien sanitizeVietnameseText(GiaoVien giaoVien) {
        giaoVien.setHoTen(decodeMojibake(giaoVien.getHoTen()));
        giaoVien.setBoMon(decodeMojibake(giaoVien.getBoMon()));
        giaoVien.setTrinhDo(decodeMojibake(giaoVien.getTrinhDo()));
        return giaoVien;
    }

    private String decodeMojibake(String value) {
        if (value == null || value.isBlank()) return value;
        if (!MOJIBAKE_PATTERN.matcher(value).find()) return value;
        try {
            return new String(value.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            return value;
        }
    }

    private void createTeacherAccount(String username) {
        UserRequest request = new UserRequest();
        request.setUsername(username);
        request.setEmail(username);
        request.setPassword(DEFAULT_ACCOUNT_PASSWORD);
        request.setStatus(1);
        request.setRole("GIAO_VIEN");
        userService.create(request);
    }

    private User ensureTeacherAccountExists(String username) {
        if (username == null || username.isBlank()) {
            throw new ApiException("Thiếu username/email tài khoản giáo viên");
        }
        return userRepository.findByUsername(username)
                .orElseGet(() -> {
                    createTeacherAccount(username);
                    return userRepository.findByUsername(username)
                            .orElseThrow(() -> new ApiException("Không thể tạo tài khoản giáo viên"));
                });
    }

    private String generateUniqueTeacherCode() {
        int suffix = 1;
        while (true) {
            String candidate = String.format("GV%04d", suffix);
            if (giaoVienRepository.findByMaGiaoVien(candidate).isEmpty()) {
                return candidate;
            }
            suffix += 1;
        }
    }

    private String generateUniqueUsername(String fullName) {
        String baseLocalPart = buildLocalPart(fullName);
        int suffix = 1;
        while (true) {
            String localPart = suffix == 1 ? baseLocalPart : baseLocalPart + suffix;
            String candidate = localPart + DEFAULT_ACCOUNT_SUFFIX;
            if (userRepository.findByUsername(candidate).isEmpty()) return candidate;
            suffix += 1;
        }
    }

    private String buildLocalPart(String fullName) {
        if (fullName == null || fullName.isBlank()) return "giaovien";
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 0) return "giaovien";

        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < parts.length - 1; i++) {
            String normalized = normalizeAscii(parts[i]);
            if (!normalized.isEmpty()) builder.append(normalized.charAt(0));
        }

        String lastName = normalizeAscii(parts[parts.length - 1]);
        if (!lastName.isEmpty()) builder.append(lastName);

        String result = builder.toString();
        return result.isEmpty() ? "giaovien" : result;
    }

    private String normalizeAscii(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .replaceAll("[^a-zA-Z0-9]", "")
                .toLowerCase(Locale.ROOT);
    }
}