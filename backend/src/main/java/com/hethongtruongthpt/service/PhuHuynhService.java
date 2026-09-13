package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.entity.PhuHuynhHocSinh;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.PhuHuynhHocSinhRepository;
import com.hethongtruongthpt.repository.PhuHuynhRepository;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.util.DefaultAccountPasswordPolicy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PhuHuynhService {
    private final PhuHuynhRepository phuHuynhRepository;
    private final PhuHuynhHocSinhRepository phuHuynhHocSinhRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DefaultAccountPasswordPolicy passwordPolicy;

    public PhuHuynhService(PhuHuynhRepository phuHuynhRepository,
                           PhuHuynhHocSinhRepository phuHuynhHocSinhRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           DefaultAccountPasswordPolicy passwordPolicy) {
        this.phuHuynhRepository = phuHuynhRepository;
        this.phuHuynhHocSinhRepository = phuHuynhHocSinhRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
    }

    public PhuHuynh getByUsername(String username) {
        if (username == null || username.isBlank()) return null;
        String raw = username.trim();
        String normalized = raw.toLowerCase();

        // 1. Try lookup by User.username (most reliable)
        Optional<User> userOpt = userRepository.findByUsername(raw);
        if (userOpt.isEmpty() && !raw.equals(normalized)) {
            userOpt = userRepository.findByUsername(normalized);
        }
        if (userOpt.isPresent()) {
            Optional<PhuHuynh> byUserId = phuHuynhRepository.findByUserId(userOpt.get().getId());
            if (byUserId.isPresent()) {
                return byUserId.get();
            }
        }

        // 2. Fallback: lookup by email
        return phuHuynhRepository.findByEmailIgnoreCase(normalized).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<HocSinh> getStudentsByPhuHuynhId(Integer phuHuynhId) {
        List<PhuHuynhHocSinh> links = phuHuynhHocSinhRepository.findByPhuHuynhId(phuHuynhId);
        List<HocSinh> students = new ArrayList<>();
        for (PhuHuynhHocSinh link : links) {
            if (link.getHocSinh() != null) {
                students.add(link.getHocSinh());
            }
        }
        return students;
    }

    public List<PhuHuynh> getAll() {
        return phuHuynhRepository.findAll();
    }

    public Page<PhuHuynh> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("hoTen").ascending());
        return phuHuynhRepository.findAll(pageable);
    }

    public PhuHuynh getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return phuHuynhRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phụ huynh"));
    }

    private static final java.util.regex.Pattern PARENT_NAME_PATTERN =
            java.util.regex.Pattern.compile("^[A-Za-zÀ-ỹĐđ\\s]+$");
    private static final java.util.regex.Pattern PHONE_PATTERN =
            java.util.regex.Pattern.compile("^0\\d{9}$");
    private static final java.util.regex.Pattern EMAIL_PATTERN =
            java.util.regex.Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final java.util.regex.Pattern JOB_PATTERN =
            java.util.regex.Pattern.compile("^[A-Za-zÀ-ỹĐđ0-9\\s,\\/\\.\\-]+$");

    private void validatePhuHuynh(PhuHuynh phuHuynh) {
        if (phuHuynh.getHoTen() == null || phuHuynh.getHoTen().isBlank()) {
            throw new ApiException("Họ và tên phụ huynh không được để trống");
        }
        String trimmedName = phuHuynh.getHoTen().trim();
        String[] words = trimmedName.split("\\s+");
        if (words.length < 2) {
            throw new ApiException("Họ và tên phụ huynh phải có ít nhất 2 từ (vd: Nguyễn Văn A)");
        }
        if (!PARENT_NAME_PATTERN.matcher(trimmedName).matches()) {
            throw new ApiException("Họ và tên phụ huynh chỉ được chứa chữ cái tiếng Việt và khoảng trắng, không chứa số hay ký tự đặc biệt");
        }

        String sdt = phuHuynh.getSoDienThoai();
        if (sdt != null && !sdt.isBlank() && !sdt.equals("0000000000")) {
            if (!PHONE_PATTERN.matcher(sdt.trim()).matches()) {
                throw new ApiException("Số điện thoại phụ huynh phải gồm 10 chữ số và bắt đầu bằng số 0");
            }
        }

        String email = phuHuynh.getEmail();
        if (email != null && !email.isBlank()) {
            if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
                throw new ApiException("Email phụ huynh không đúng định dạng (vd: phuhuynh@gmail.com)");
            }
        }

        String job = phuHuynh.getNgheNghiep();
        if (job != null && !job.isBlank()) {
            if (!JOB_PATTERN.matcher(job.trim()).matches()) {
                throw new ApiException("Nghề nghiệp phụ huynh không được chứa ký tự đặc biệt không hợp lệ");
            }
        }
    }

    public PhuHuynh create(PhuHuynh phuHuynh) {
        if (phuHuynh == null) {
            throw new ApiException("Thông tin phụ huynh không được để trống");
        }
        validatePhuHuynh(phuHuynh);

        if (phuHuynh.getSoDienThoai() == null || phuHuynh.getSoDienThoai().isBlank()) {
            phuHuynh.setSoDienThoai("0000000000");
        }

        if (phuHuynh.getUser() == null) {
            String username = phuHuynh.getEmail();
            if (username == null || username.isBlank()) {
                // fallback username from name
                String name = phuHuynh.getHoTen() == null ? "phuhuynh" : phuHuynh.getHoTen().replaceAll("\\s+", "").toLowerCase();
                username = name + System.currentTimeMillis() % 10000;
            }
            username = username.trim();
            Optional<User> existing = userRepository.findByUsername(username);
            User user;
            if (existing.isPresent()) {
                user = existing.get();
            } else {
                user = new User();
                user.setUsername(username);
                user.setPassword(passwordEncoder.encode(passwordPolicy.getParentDefaultPassword()));
                user.setRole(RoleEnum.PHU_HUYNH);
                user.setIsActive(true);
                user.setMustChangePassword(true);
                user = userRepository.save(user);
            }
            phuHuynh.setUser(user);
        }

        if (phuHuynh.getQuanHe() == null) phuHuynh.setQuanHe("CHA");
        if (phuHuynh.getIsSmSActive() == null) phuHuynh.setIsSmSActive(true);

        return phuHuynhRepository.save(phuHuynh);
    }

    public PhuHuynh update(Integer id, PhuHuynh phuHuynh) {
        PhuHuynh existing = getById(id);
        if (phuHuynh.getHoTen() != null && !phuHuynh.getHoTen().isBlank()) {
            existing.setHoTen(phuHuynh.getHoTen().trim());
        }
        if (phuHuynh.getSoDienThoai() != null && !phuHuynh.getSoDienThoai().isBlank()) {
            existing.setSoDienThoai(phuHuynh.getSoDienThoai().trim());
        }
        if (phuHuynh.getEmail() != null) {
            existing.setEmail(phuHuynh.getEmail().trim());
        }
        if (phuHuynh.getNgheNghiep() != null) {
            existing.setNgheNghiep(phuHuynh.getNgheNghiep().trim());
        }
        if (phuHuynh.getQuanHe() != null) {
            existing.setQuanHe(phuHuynh.getQuanHe());
        }
        if (phuHuynh.getIsSmSActive() != null) {
            existing.setIsSmSActive(phuHuynh.getIsSmSActive());
        }
        validatePhuHuynh(existing);
        return phuHuynhRepository.save(existing);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        phuHuynhRepository.deleteById(id);
    }
}
