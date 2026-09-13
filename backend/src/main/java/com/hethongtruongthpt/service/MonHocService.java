package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.MonHocRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.Set;
import org.springframework.dao.DataIntegrityViolationException;

@Service
public class MonHocService {
    private static final Set<String> REMARK_ONLY_SUBJECTS = Set.of(
            normalizeSubjectName("Giáo dục thể chất (GDTC)"),
            normalizeSubjectName("Âm nhạc"),
            normalizeSubjectName("Nội dung giáo dục địa phương (GDĐP)"),
            normalizeSubjectName("Hoạt động trải nghiệm, hướng nghiệp (HĐTN, HN)")
    );
    private static final String DEFAULT_KHOI_AP_DUNG = "10,11,12";

    private final MonHocRepository monHocRepository;

    public MonHocService(MonHocRepository monHocRepository) {
        this.monHocRepository = monHocRepository;
    }

    public List<MonHoc> getAll() {
        return monHocRepository.findAll();
    }

    public Page<MonHoc> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("tenMon").ascending());
        return monHocRepository.findAll(pageable);
    }

    public MonHoc getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return monHocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học"));
    }

    public MonHoc create(MonHoc monHoc) {
        String tenMon = requireTenMon(monHoc.getTenMon());

        if (monHocRepository.findByTenMon(tenMon).isPresent()) {
            throw new ApiException("Môn học đã tồn tại");
        }

        MonHoc entity = new MonHoc();
        applySubjectValues(entity, monHoc, tenMon, true);
        String baseMa = resolveMaMonBase(tenMon);
        entity.setMaMon(baseMa);

        // retry-on-conflict: handle parallel inserts that hit unique constraint
        int attempts = 0;
        int maxAttempts = 6;
        Random rnd = new Random();
        while (true) {
            try {
                return monHocRepository.save(entity);
            } catch (DataIntegrityViolationException ex) {
                attempts++;
                if (attempts >= maxAttempts) {
                    throw new ApiException("Không thể tạo môn học do xung đột dữ liệu. Vui lòng thử lại.");
                }
                // generate a new candidate maMon by appending a short random suffix
                String suffix = String.valueOf(1000 + rnd.nextInt(9000));
                int maxBaseLen = Math.max(1, 20 - suffix.length());
                String newMa = baseMa.substring(0, Math.min(baseMa.length(), maxBaseLen)) + suffix;
                entity.setMaMon(newMa);
            }
        }
    }

    public MonHoc update(Integer id, MonHoc monHoc) {
        MonHoc existing = getById(id);
        String tenMon = requireTenMon(monHoc.getTenMon());

        monHocRepository.findByTenMon(tenMon)
                .filter(found -> !found.getId().equals(id))
                .ifPresent(found -> {
                    throw new ApiException("Môn học đã tồn tại");
                });

        applySubjectValues(existing, monHoc, tenMon, false);
        if (isBlank(existing.getMaMon())) {
            existing.setMaMon(resolveMaMon(tenMon));
        }
        return monHocRepository.save(existing);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        monHocRepository.deleteById(id);
    }

    private static final java.util.regex.Pattern SUBJECT_NAME_PATTERN =
            java.util.regex.Pattern.compile("^[A-ZÀ-Ỹa-zà-ỹ0-9\\s(),\\.-]+$");
    private static final java.util.regex.Pattern SUBJECT_CODE_PATTERN =
            java.util.regex.Pattern.compile("^[A-Za-z0-9_-]+$");

    private void applySubjectValues(MonHoc target, MonHoc source, String tenMon, boolean isCreate) {
        target.setTenMon(tenMon);
        target.setNhomDanhGia(resolveNhomDanhGia(source, tenMon));
        Integer soDtx = resolveSoDtxHocKy(source, tenMon);
        if (soDtx != null && (soDtx < 0 || soDtx > 10)) {
            throw new ApiException("Số ĐTX phải từ 0 đến 10");
        }
        target.setSoDtxHocKy(soDtx);
        target.setKhoiApDung(resolveKhoiApDung(source));
        target.setMoTa(source.getMoTa());
        target.setIsActive(source.getIsActive() != null ? source.getIsActive() : true);

        if (!isCreate && !isBlank(source.getMaMon())) {
            String trimmedMa = source.getMaMon().trim();
            if (!SUBJECT_CODE_PATTERN.matcher(trimmedMa).matches()) {
                throw new ApiException("Mã môn học chỉ được chứa chữ cái, chữ số, gạch ngang và gạch dưới");
            }
            target.setMaMon(trimmedMa);
        }
    }

    private String resolveNhomDanhGia(MonHoc source, String tenMon) {
        if (!isBlank(source.getNhomDanhGia())) {
            return source.getNhomDanhGia().trim();
        }
        return isRemarkOnlySubject(tenMon) ? "NHAN_XET" : "DIEM_SO";
    }

    private Integer resolveSoDtxHocKy(MonHoc source, String tenMon) {
        if (source.getSoDtxHocKy() != null) {
            return source.getSoDtxHocKy();
        }
        return isRemarkOnlySubject(tenMon) ? 0 : 4;
    }

    private String resolveKhoiApDung(MonHoc source) {
        if (!isBlank(source.getKhoiApDung())) {
            return source.getKhoiApDung().trim();
        }
        return DEFAULT_KHOI_AP_DUNG;
    }

    private String resolveMaMonBase(String tenMon) {
        String base = normalizeSubjectName(tenMon)
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]", "");
        if (base.isEmpty()) {
            base = "MONHOC";
        }
        if (base.length() > 20) {
            base = base.substring(0, 20);
        }
        return base;
    }

    private String resolveMaMon(String tenMon) {
        String base = normalizeSubjectName(tenMon)
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]", "");
        if (base.isEmpty()) {
            base = "MONHOC";
        }
        if (base.length() > 20) {
            base = base.substring(0, 20);
        }

        String candidate = base;
        int suffix = 2;
        int maxRetries = 1000;
        while (monHocRepository.findByMaMon(candidate).isPresent()) {
            if (suffix > maxRetries) {
                throw new ApiException("Không thể tạo mã môn học duy nhất sau " + maxRetries + " lần thử");
            }
            String suffixText = String.valueOf(suffix++);
            int maxBaseLength = Math.max(1, 20 - suffixText.length());
            candidate = base.substring(0, Math.min(base.length(), maxBaseLength)) + suffixText;
        }
        return candidate;
    }

    private String requireTenMon(String tenMon) {
        if (isBlank(tenMon)) {
            throw new ApiException("Vui lòng nhập tên môn.");
        }
        String trimmed = tenMon.trim();
        if (!SUBJECT_NAME_PATTERN.matcher(trimmed).matches()) {
            throw new ApiException("Tên môn học không được chứa ký tự đặc biệt không hợp lệ (vd: @, #, $, %, !, *, <, >)");
        }
        return trimmed;
    }

    private boolean isRemarkOnlySubject(String tenMon) {
        return REMARK_ONLY_SUBJECTS.contains(normalizeSubjectName(tenMon));
    }

    private static String normalizeSubjectName(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replace('đ', 'd')
                .replaceAll("[^a-z0-9]", "")
                .trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}