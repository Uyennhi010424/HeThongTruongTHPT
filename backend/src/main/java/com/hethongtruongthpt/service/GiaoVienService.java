package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.giaovien.GiaoVienDTO;
import com.hethongtruongthpt.dto.user.UserRequest;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.repository.ChuNhiemRepository;
import com.hethongtruongthpt.repository.DiemRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.HanhKiemRepository;
import com.hethongtruongthpt.repository.MonHocRepository;
import com.hethongtruongthpt.repository.NamHocRepository;
import com.hethongtruongthpt.repository.PhanCongDayRepository;
import com.hethongtruongthpt.repository.ThoiKhoaBieuRepository;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.util.DefaultAccountPasswordPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@Transactional
public class GiaoVienService {
    private static final Logger log = LoggerFactory.getLogger(GiaoVienService.class);
    private static final String DEFAULT_ACCOUNT_SUFFIX = "c3@tdu.edu.vn";
    private static final Pattern MOJIBAKE_PATTERN = Pattern.compile("(Ã|Â|á»|áº|Ä|Å|ð|ñ|ß)");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^0\\d{9}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final java.util.Set<String> VALID_TRINH_DO = java.util.Set.of(
            "Cử nhân", "Cử nhân Sư phạm", "Kỹ sư", "Thạc sĩ", "Tiến sĩ", "Phó giáo sư", "Giáo sư"
    );

    private final GiaoVienRepository giaoVienRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final ChuNhiemRepository chuNhiemRepository;
    private final PhanCongDayRepository phanCongDayRepository;
    private final ThoiKhoaBieuRepository thoiKhoaBieuRepository;
    private final HanhKiemRepository hanhKiemRepository;
    private final DiemRepository diemRepository;
    private final DefaultAccountPasswordPolicy passwordPolicy;
    private final MonHocRepository monHocRepository;
    private final com.hethongtruongthpt.repository.LopHocRepository lopHocRepository;
    private final NamHocRepository namHocRepository;

    public GiaoVienService(
            GiaoVienRepository giaoVienRepository,
            UserService userService,
            UserRepository userRepository,
            ChuNhiemRepository chuNhiemRepository,
            PhanCongDayRepository phanCongDayRepository,
            ThoiKhoaBieuRepository thoiKhoaBieuRepository,
            HanhKiemRepository hanhKiemRepository,
            DiemRepository diemRepository,
            DefaultAccountPasswordPolicy passwordPolicy,
            MonHocRepository monHocRepository,
            com.hethongtruongthpt.repository.LopHocRepository lopHocRepository,
            NamHocRepository namHocRepository
    ) {
        this.giaoVienRepository = giaoVienRepository;
        this.userService = userService;
        this.userRepository = userRepository;
        this.chuNhiemRepository = chuNhiemRepository;
        this.phanCongDayRepository = phanCongDayRepository;
        this.thoiKhoaBieuRepository = thoiKhoaBieuRepository;
        this.hanhKiemRepository = hanhKiemRepository;
        this.diemRepository = diemRepository;
        this.passwordPolicy = passwordPolicy;
        this.monHocRepository = monHocRepository;
        this.lopHocRepository = lopHocRepository;
        this.namHocRepository = namHocRepository;
    }

    public List<GiaoVienDTO> getAll() {
        List<MonHoc> cachedMonHoc = monHocRepository.findAll(); // load 1 lần
        return giaoVienRepository.findAll().stream()
                .map(gv -> sanitizeVietnameseText(gv, cachedMonHoc))
                .map(this::toDto)
                .toList();
    }

    public Page<GiaoVienDTO> getAllPaged(int page, int size) {
        List<MonHoc> cachedMonHoc = monHocRepository.findAll(); // load 1 lần
        Pageable pageable = PageRequest.of(page, size, Sort.by("hoTen").ascending());
        return giaoVienRepository.findAll(pageable)
                .map(gv -> sanitizeVietnameseText(gv, cachedMonHoc))
                .map(this::toDto);
    }

    public GiaoVienDTO getByUsername(String username) {
        if (username == null || username.isBlank()) return null;
        User user = userRepository.findByUsername(username.trim())
                .orElse(null);
        if (user == null) return null;
        return giaoVienRepository.findByUserId(user.getId())
                .map(gv -> sanitizeVietnameseText(gv, null))
                .map(this::toDto)
                .orElse(null);
    }

    public GiaoVienDTO getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        GiaoVien giaoVien = giaoVienRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên"));
        return toDto(sanitizeVietnameseText(giaoVien, null));
    }

    public GiaoVienDTO create(GiaoVien giaoVien) {
        if (giaoVien.getHoTen() == null || giaoVien.getHoTen().isBlank()) {
            throw new ApiException("Thiếu họ tên giáo viên");
        }
        validateTeacher(giaoVien);

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
        return toDto(sanitizeVietnameseText(saved, null));
    }

    public GiaoVienDTO update(Integer id, GiaoVien giaoVien) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        GiaoVien existing = giaoVienRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên"));
        validateTeacher(giaoVien);

        if (giaoVien.getHoTen() != null) {
            existing.setHoTen(giaoVien.getHoTen());
        }
        existing.setNgaySinh(giaoVien.getNgaySinh());
        existing.setDiaChi(giaoVien.getDiaChi());
        existing.setSoDienThoai(giaoVien.getSoDienThoai());
        existing.setGioiTinh(giaoVien.getGioiTinh());
        existing.setBoMon(giaoVien.getBoMon());
        existing.setTrinhDo(giaoVien.getTrinhDo());
        if (giaoVien.getAnhDaiDien() != null) {
            existing.setAnhDaiDien(giaoVien.getAnhDaiDien());
        }

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
        return toDto(sanitizeVietnameseText(saved, null));
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        if (!giaoVienRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy giáo viên");
        }

        if (!chuNhiemRepository.findById_GiaoVienId(id).isEmpty()) {
            throw new ApiException("Không thể xóa giáo viên đang chủ nhiệm lớp. Vui lòng bỏ chủ nhiệm trước.");
        }
        if (!phanCongDayRepository.findByGiaoVienId(id).isEmpty()) {
            throw new ApiException("Không thể xóa giáo viên đang được phân công dạy. Vui lòng xóa phân công trước.");
        }
        if (!thoiKhoaBieuRepository.findByGiaoVienId(id).isEmpty()) {
            throw new ApiException("Không thể xóa giáo viên có lịch trong thời khóa biểu. Vui lòng xóa lịch trước.");
        }
        if (!hanhKiemRepository.findByGiaoVienId(id).isEmpty()) {
            throw new ApiException("Không thể xóa giáo viên có dữ liệu hạnh kiểm.");
        }
        if (diemRepository.existsByGiaoVienNhapId(id)) {
            throw new ApiException("Không thể xóa giáo viên có dữ liệu điểm. Vui lòng xóa điểm trước.");
        }

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

    private static final java.util.regex.Pattern NAME_PATTERN =
            java.util.regex.Pattern.compile("^[A-ZÀ-Ỹ][a-zà-ỹ]+(\\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)+$");

    private void validateTeacher(GiaoVien giaoVien) {
        // Validate họ tên
        String hoTen = giaoVien.getHoTen();
        if (hoTen != null && !hoTen.isBlank()) {
            String trimmed = hoTen.trim();
            String[] words = trimmed.split("\\s+");
            if (words.length < 2) {
                throw new ApiException("Họ tên phải có ít nhất 2 từ (vd: Trần Minh)");
            }
            if (!NAME_PATTERN.matcher(trimmed).matches()) {
                throw new ApiException("Mỗi từ phải bắt đầu bằng chữ hoa, chỉ chứa chữ cái (vd: Nguyễn Vy)");
            }
        }

        // Validate trình độ
        String trinhDo = giaoVien.getTrinhDo();
        if (trinhDo != null && !trinhDo.isBlank() && !VALID_TRINH_DO.contains(trinhDo.trim())) {
            throw new ApiException("Trình độ không hợp lệ. Chọn: Cử nhân, Cử nhân Sư phạm, Kỹ sư, Thạc sĩ, Tiến sĩ, Phó giáo sư, Giáo sư");
        }

        // Validate SĐT
        String sdt = giaoVien.getSoDienThoai();
        if (sdt != null && !sdt.isBlank() && !PHONE_PATTERN.matcher(sdt.trim()).matches()) {
            throw new ApiException("Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0");
        }

        // Validate email
        String email = giaoVien.getEmail();
        if (email != null && !email.isBlank() && !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new ApiException("Email không đúng định dạng");
        }

        // Validate ngày sinh
        LocalDate ngaySinh = giaoVien.getNgaySinh();
        if (ngaySinh != null) {
            if (ngaySinh.isAfter(LocalDate.now())) {
                throw new ApiException("Ngày sinh không được là ngày tương lai");
            }
            int age = LocalDate.now().getYear() - ngaySinh.getYear();
            if (ngaySinh.plusYears(age).isAfter(LocalDate.now())) {
                age--;
            }
            if (age < 24) {
                throw new ApiException("Giáo viên phải từ 24 tuổi trở lên");
            }
        }
    }

    private String getActiveNamHocName() {
        if (namHocRepository != null) {
            java.util.List<com.hethongtruongthpt.entity.NamHoc> active = namHocRepository.findByTrangThai("DANG_MO");
            if (!active.isEmpty()) {
                return active.get(0).getTenNamHoc();
            }
        }
        return "2026-2027";
    }

    private GiaoVienDTO toDto(GiaoVien giaoVien) {
        if (giaoVien == null) return null;
        GiaoVienDTO dto = new GiaoVienDTO();
        dto.setId(giaoVien.getId());
        dto.setMaGiaoVien(giaoVien.getMaGiaoVien());
        dto.setHoTen(giaoVien.getHoTen());
        dto.setEmail(giaoVien.getEmail());
        dto.setSdt(giaoVien.getSoDienThoai());
        dto.setBoMon(giaoVien.getBoMon());
        dto.setTrinhDo(giaoVien.getTrinhDo());
        dto.setGioiTinh(giaoVien.getGioiTinh());
        dto.setNgaySinh(giaoVien.getNgaySinh());
        dto.setDiaChi(giaoVien.getDiaChi());
        dto.setAnhDaiDien(giaoVien.getAnhDaiDien());
        if (giaoVien.getUser() != null) {
            dto.setUsername(giaoVien.getUser().getUsername());
        }

        // Map GVCN info from LopHoc cho năm học hiện hành (DANG_MO)
        String activeNamHoc = getActiveNamHocName();
        java.util.List<com.hethongtruongthpt.entity.LopHoc> lopHocs = lopHocRepository.findByGvcnIdAndNamHoc(giaoVien.getId(), activeNamHoc);
        if (lopHocs != null && !lopHocs.isEmpty()) {
            dto.setIsGvcn(true);
            com.hethongtruongthpt.entity.LopHoc lop = lopHocs.get(0);
            dto.setTenLopChuNhiem(lop.getTenLop());
            dto.setLopChuNhiemId(lop.getId());
        } else {
            dto.setIsGvcn(false);
            dto.setTenLopChuNhiem(null);
            dto.setLopChuNhiemId(null);
        }

        return dto;
    }

    private GiaoVien sanitizeVietnameseText(GiaoVien giaoVien, List<MonHoc> cachedMonHoc) {
        giaoVien.setHoTen(decodeMojibake(giaoVien.getHoTen()));
        giaoVien.setBoMon(normalizeBoMon(decodeMojibake(giaoVien.getBoMon()), cachedMonHoc));
        giaoVien.setTrinhDo(decodeMojibake(giaoVien.getTrinhDo()));
        return giaoVien;
    }

    /**
     * Normalize bo_mon by matching against canonical mon_hoc.ten_mon values.
     * Handles cases where bo_mon has '?' or U+FFFD (replacement char) from encoding corruption.
     */
    private String normalizeBoMon(String boMon, List<MonHoc> cachedMonHoc) {
        if (boMon == null || boMon.isBlank()) return boMon;

        // Check if bo_mon is corrupted: contains '?' or U+FFFD replacement character
        boolean corrupted = boMon.contains("?") || boMon.contains("�");
        if (!corrupted) return boMon;

        String normalized = normalizeForMatching(boMon);
        if (normalized.isEmpty()) return boMon;

        // Dùng danh sách môn học đã cache thay vì gọi DB mỗi lần
        List<MonHoc> allMonHoc = cachedMonHoc != null ? cachedMonHoc : monHocRepository.findAll();
        for (MonHoc mh : allMonHoc) {
            if (mh.getTenMon() != null && normalizeForMatching(mh.getTenMon()).equals(normalized)) {
                return mh.getTenMon();
            }
        }

        // Partial match: check if normalized boMon contains or is contained in a subject name
        for (MonHoc mh : allMonHoc) {
            if (mh.getTenMon() != null) {
                String mhNorm = normalizeForMatching(mh.getTenMon());
                if (mhNorm.length() >= 4 && (normalized.contains(mhNorm) || mhNorm.contains(normalized))) {
                    return mh.getTenMon();
                }
            }
        }

        return boMon;
    }

    /**
     * Strip Vietnamese diacritics and lowercase for fuzzy matching.
     * Replaces '?' and '�' (U+FFFD) with a single letter placeholder before normalization
     * so corrupted text like "?m nh?c" can still match "âm nhạc".
     */
    private String normalizeForMatching(String value) {
        if (value == null) return "";
        // Replace corruption markers with a placeholder letter before normalization
        String cleaned = value.replace("�", "a").replace("?", "a");
        return java.text.Normalizer.normalize(cleaned, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}", "")
                .replace("đ", "d").replace("Đ", "D")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String decodeMojibake(String value) {
        if (value == null || value.isBlank()) return value;
        if (!MOJIBAKE_PATTERN.matcher(value).find()) return value;
        try {
            return new String(value.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            log.warn("Không thể decode mojibake cho giá trị '{}': {}", value, ex.getMessage());
            return value;
        }
    }

    private void createTeacherAccount(String username) {
        UserRequest request = new UserRequest();
        request.setUsername(username);
        request.setEmail(username);
        request.setPassword(passwordPolicy.getTeacherDefaultPassword(username));
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
        int maxRetries = 1000;
        while (suffix <= maxRetries) {
            String candidate = String.format("GV%04d", suffix);
            if (giaoVienRepository.findByMaGiaoVien(candidate).isEmpty()) {
                return candidate;
            }
            suffix += 1;
        }
        throw new ApiException("Không thể tạo mã giáo viên duy nhất sau " + maxRetries + " lần thử");
    }

    private String generateUniqueUsername(String fullName) {
        String baseLocalPart = buildLocalPart(fullName);
        int suffix = 1;
        int maxRetries = 1000;
        while (suffix <= maxRetries) {
            String localPart = suffix == 1 ? baseLocalPart : baseLocalPart + suffix;
            String candidate = localPart + DEFAULT_ACCOUNT_SUFFIX;
            if (userRepository.findByUsername(candidate).isEmpty()) return candidate;
            suffix += 1;
        }
        throw new ApiException("Không thể tạo username giáo viên duy nhất sau " + maxRetries + " lần thử");
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