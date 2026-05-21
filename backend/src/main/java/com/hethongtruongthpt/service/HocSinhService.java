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

    public HocSinh getById(Integer id) {
        return hocSinhRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
    }

    public HocSinh create(HocSinh hocSinh) {
        hocSinh.setLop(resolveLop(hocSinh));
        String generatedUsername = generateUniqueUsername(hocSinh.getHoTen());
        HocSinh saved = hocSinhRepository.save(hocSinh);
        createStudentAccount(generatedUsername);
        return getById(saved.getId());
    }

    public HocSinh update(Integer id, HocSinh hocSinh) {
        HocSinh existing = getById(id);
        if (hocSinh.getLop() != null && hocSinh.getLop().getId() != null) {
            hocSinh.setLop(resolveLop(hocSinh));
        } else {
            hocSinh.setLop(existing.getLop());
        }
        hocSinh.setId(id);
        HocSinh saved = hocSinhRepository.save(hocSinh);
        return getById(saved.getId());
    }

    public void delete(Integer id) {
        hocSinhRepository.deleteById(id);
    }

    private LopHoc resolveLop(HocSinh hocSinh) {
        Integer lopId = hocSinh.getLop() != null ? hocSinh.getLop().getId() : null;
        if (lopId == null) {
            throw new ResourceNotFoundException("Vui lòng chọn lớp học hợp lệ");
        }

        return lopHocRepository.findById(lopId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
    }

    private void createStudentAccount(String username) {
        UserRequest request = new UserRequest();
        request.setUsername(username);
        request.setEmail(username);
        request.setPassword(DEFAULT_ACCOUNT_PASSWORD);
        request.setStatus(1);
        request.setRole(RoleEnum.HOC_SINH.name());
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
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .replaceAll("[^a-zA-Z0-9]", "")
                .toLowerCase(Locale.ROOT);
    }
}
