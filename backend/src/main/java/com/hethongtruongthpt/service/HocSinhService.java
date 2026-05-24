package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.user.UserRequest;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.repository.PhuHuynhHocSinhRepository;
import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.entity.PhuHuynhHocSinh;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.time.Year;

@Service
@Transactional
public class HocSinhService {
    private static final String DEFAULT_ACCOUNT_DOMAIN = "@tdn.edu.vn";
    private static final String DEFAULT_ACCOUNT_PASSWORD = "Abc1234@";

    private final HocSinhRepository hocSinhRepository;
    private final LopHocRepository lopHocRepository;
    private final UserRepository userRepository;
    private final PhuHuynhHocSinhRepository phuHuynhHocSinhRepository;
    private final PasswordEncoder passwordEncoder;

    public HocSinhService(
            HocSinhRepository hocSinhRepository,
            LopHocRepository lopHocRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            PhuHuynhHocSinhRepository phuHuynhHocSinhRepository
    ) {
        this.hocSinhRepository = hocSinhRepository;
        this.lopHocRepository = lopHocRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.phuHuynhHocSinhRepository = phuHuynhHocSinhRepository;
    }

    public List<HocSinh> getAll() {
        List<HocSinh> list = hocSinhRepository.findAll();
        // populate linked parent id when available
        for (HocSinh hs : list) {
            assignParentId(hs);
        }
        return list;
    }

    public HocSinh getById(Integer id) {
        HocSinh hs = hocSinhRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
        assignParentId(hs);
        return hs;
    }

    public HocSinh create(HocSinh hocSinh) {
        hocSinh.setLop(resolveLop(hocSinh));
        hocSinh.setUser(resolveOrCreateStudentUser(hocSinh.getHoTen()));
        hocSinh.setMaHocSinh(resolveOrCreateMaHocSinh(hocSinh));
        HocSinh saved = hocSinhRepository.save(hocSinh);
        // if request carried phuHuynhId transient, create mapping
        if (hocSinh.getPhuHuynhId() != null) {
            try {
                PhuHuynhHocSinh link = new PhuHuynhHocSinh();
                PhuHuynh ph = new PhuHuynh();
                ph.setId(hocSinh.getPhuHuynhId());
                link.setPhuHuynh(ph);
                HocSinh href = new HocSinh();
                href.setId(saved.getId());
                link.setHocSinh(href);
                // required non-null fields on PhuHuynhHocSinh: set sensible defaults
                link.setQuanHe("CHA");
                link.setLaNguoiLienHeChinh(Boolean.TRUE);
                phuHuynhHocSinhRepository.save(link);
            } catch (Exception e) {
                // ignore mapping errors, student creation succeeded
            }
        }
        return getById(saved.getId());
    }

    private void assignParentId(HocSinh hs) {
        if (hs == null) return;
        try {
            var list = phuHuynhHocSinhRepository.findByHocSinhIdAndLaNguoiLienHeChinhTrue(hs.getId());
            if (list != null && !list.isEmpty()) {
                hs.setPhuHuynhId(list.get(0).getPhuHuynh().getId());
                return;
            }
            var all = phuHuynhHocSinhRepository.findByHocSinhId(hs.getId());
            if (all != null && !all.isEmpty()) {
                hs.setPhuHuynhId(all.get(0).getPhuHuynh().getId());
            }
        } catch (Exception e) {
            // ignore
        }
    }

    public HocSinh update(Integer id, HocSinh hocSinh) {
        HocSinh existing = getById(id);
        if (hocSinh.getLop() != null && hocSinh.getLop().getId() != null) {
            hocSinh.setLop(resolveLop(hocSinh));
        } else {
            hocSinh.setLop(existing.getLop());
        }
        if (hocSinh.getUser() == null) {
            hocSinh.setUser(existing.getUser() != null ? existing.getUser() : resolveOrCreateStudentUser(hocSinh.getHoTen()));
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

    private User resolveOrCreateStudentUser(String fullName) {
        String username = generateUniqueUsername(fullName);
        return userRepository.findByUsername(username)
                .orElseGet(() -> {
                    User user = new User();
                    user.setUsername(username);
                    user.setPassword(passwordEncoder.encode(DEFAULT_ACCOUNT_PASSWORD));
                    user.setRole(RoleEnum.HOC_SINH);
                    user.setIsActive(true);
                    return userRepository.save(user);
                });
    }

    private String resolveOrCreateMaHocSinh(HocSinh hocSinh) {
        String provided = hocSinh.getMaHocSinh();
        if (provided != null && !provided.isBlank()) {
            String trimmed = provided.trim();
            if (hocSinhRepository.findByMaHocSinh(trimmed).isEmpty()) {
                return trimmed;
            }
        }

        int year = hocSinh.getNamNhapHoc() != null ? hocSinh.getNamNhapHoc() : Year.now().getValue();
        String baseCode = "HS" + year;
        int suffix = 1;

        while (true) {
            String candidate = suffix == 1 ? baseCode : baseCode + String.format("%03d", suffix);
            if (hocSinhRepository.findByMaHocSinh(candidate).isEmpty()) {
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
