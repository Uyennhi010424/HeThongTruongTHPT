package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.user.UserRequest;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class HocSinhService {
    private static final String DEFAULT_ACCOUNT_DOMAIN = "@tdn.edu.vn";
    private static final String DEFAULT_ACCOUNT_PASSWORD = "Abc1234@";

    private final HocSinhRepository hocSinhRepository;
    private final LopHocRepository lopHocRepository;
    private final UserService userService;
    private final UserRepository userRepository;

    public HocSinhService(
            HocSinhRepository hocSinhRepository,
            LopHocRepository lopHocRepository,
            UserService userService,
            UserRepository userRepository
    ) {
        this.hocSinhRepository = hocSinhRepository;
        this.lopHocRepository = lopHocRepository;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    public List<HocSinh> getAll() {
        return hocSinhRepository.findAll();
    }

    public HocSinh getById(Long id) {
        return hocSinhRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
    }

    public HocSinh create(HocSinh hocSinh) {
        hocSinh.setLopHoc(resolveLopHoc(hocSinh));
        String generatedUsername = generateUniqueUsername(hocSinh.getHoTen());
        hocSinh.setEmail(generatedUsername);
        HocSinh saved = hocSinhRepository.save(hocSinh);
        createStudentAccount(saved, generatedUsername);
        return getById(saved.getId());
    }

    public HocSinh update(Long id, HocSinh hocSinh) {
        HocSinh existing = getById(id);
        if (hocSinh.getLopHoc() != null && hocSinh.getLopHoc().getId() != null) {
            hocSinh.setLopHoc(resolveLopHoc(hocSinh));
        } else {
            hocSinh.setLopHoc(existing.getLopHoc());
        }
        hocSinh.setId(id);
        HocSinh saved = hocSinhRepository.save(hocSinh);
        return getById(saved.getId());
    }

    public void delete(Long id) {
        hocSinhRepository.deleteById(id);
    }

    private LopHoc resolveLopHoc(HocSinh hocSinh) {
        Long lopId = hocSinh.getLopHoc() != null ? hocSinh.getLopHoc().getId() : null;
        if (lopId == null) {
            throw new ResourceNotFoundException("Vui lòng chọn lớp học hợp lệ");
        }

        return lopHocRepository.findById(lopId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
    }

    private void createStudentAccount(HocSinh hocSinh, String username) {
        UserRequest request = new UserRequest();
        request.setUsername(username);
        request.setEmail(username);
        request.setPassword(DEFAULT_ACCOUNT_PASSWORD);
        request.setStatus(hocSinh.getTrangThai() != null && hocSinh.getTrangThai() == 1 ? 1 : 0);
        request.setRole(RoleEnum.HOCSINH.name());

        userService.create(request);
    }

    private String generateUniqueUsername(String fullName) {
        String baseLocalPart = buildLocalPart(fullName);
        int suffix = 1;

        while (true) {
            String localPart = suffix == 1 ? baseLocalPart : baseLocalPart + suffix;
            String candidate = localPart + DEFAULT_ACCOUNT_DOMAIN;
            if (userRepository.findByUsername(candidate).isEmpty()) {
                return candidate;
            }
            suffix += 1;
        }
    }

    private String buildLocalPart(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "hocsinh";
        }

        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 0) {
            return "hocsinh";
        }

        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < parts.length - 1; i++) {
            String normalized = normalizeAscii(parts[i]);
            if (!normalized.isEmpty()) {
                builder.append(normalized.charAt(0));
            }
        }

        String lastName = normalizeAscii(parts[parts.length - 1]);
        if (!lastName.isEmpty()) {
            builder.append(lastName);
        }

        String result = builder.toString();
        return result.isEmpty() ? "hocsinh" : result;
    }

    private String normalizeAscii(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .replaceAll("[^a-zA-Z0-9]", "")
                .toLowerCase(Locale.ROOT);
        return normalized;
    }
}