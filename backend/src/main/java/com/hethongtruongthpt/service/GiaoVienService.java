package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class GiaoVienService {
    private static final Pattern MOJIBAKE_PATTERN = Pattern.compile("(Ã|Â|á»|áº|Ä|Å|ð|ñ|ß)");
    private final GiaoVienRepository giaoVienRepository;

    public GiaoVienService(GiaoVienRepository giaoVienRepository) {
        this.giaoVienRepository = giaoVienRepository;
    }

    public List<GiaoVien> getAll() {
        return giaoVienRepository.findAll().stream()
                .map(this::sanitizeVietnameseText)
                .toList();
    }

    public GiaoVien getById(Long id) {
        GiaoVien giaoVien = giaoVienRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên"));
        return sanitizeVietnameseText(giaoVien);
    }

    public GiaoVien create(GiaoVien giaoVien) {
        GiaoVien saved = giaoVienRepository.save(giaoVien);
        return sanitizeVietnameseText(saved);
    }

    public GiaoVien update(Long id, GiaoVien giaoVien) {
        getById(id);
        giaoVien.setId(id);
        GiaoVien saved = giaoVienRepository.save(giaoVien);
        return sanitizeVietnameseText(saved);
    }

    public void delete(Long id) {
        giaoVienRepository.deleteById(id);
    }

    private GiaoVien sanitizeVietnameseText(GiaoVien giaoVien) {
        giaoVien.setHoTen(decodeMojibake(giaoVien.getHoTen()));
        giaoVien.setBoMon(decodeMojibake(giaoVien.getBoMon()));
        giaoVien.setTrinhDo(decodeMojibake(giaoVien.getTrinhDo()));
        return giaoVien;
    }

    private String decodeMojibake(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        if (!MOJIBAKE_PATTERN.matcher(value).find()) {
            return value;
        }
        try {
            return new String(value.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            return value;
        }
    }
}