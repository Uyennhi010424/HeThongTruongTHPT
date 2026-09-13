package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.TonGiao;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.TonGiaoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TonGiaoService {
    private final TonGiaoRepository tonGiaoRepository;

    public TonGiaoService(TonGiaoRepository tonGiaoRepository) {
        this.tonGiaoRepository = tonGiaoRepository;
    }

    public List<TonGiao> getAll() {
        return tonGiaoRepository.findAll();
    }

    public Page<TonGiao> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("tenTonGiao").ascending());
        return tonGiaoRepository.findAll(pageable);
    }

    public TonGiao getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return tonGiaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tôn giáo"));
    }

    private static final java.util.regex.Pattern RELIGION_NAME_PATTERN =
            java.util.regex.Pattern.compile("^[A-Za-zÀ-ỹĐđ\\s]+$");

    private void validateTonGiao(TonGiao tonGiao) {
        if (tonGiao == null || tonGiao.getTenTonGiao() == null || tonGiao.getTenTonGiao().isBlank()) {
            throw new com.hethongtruongthpt.exception.ApiException("Tên tôn giáo không được để trống");
        }
        String trimmed = tonGiao.getTenTonGiao().trim();
        if (!RELIGION_NAME_PATTERN.matcher(trimmed).matches()) {
            throw new com.hethongtruongthpt.exception.ApiException("Tên tôn giáo chỉ được chứa chữ cái tiếng Việt và khoảng trắng, không chứa số hay ký tự đặc biệt");
        }
        tonGiao.setTenTonGiao(trimmed);
    }

    public TonGiao create(TonGiao tonGiao) {
        validateTonGiao(tonGiao);
        return tonGiaoRepository.save(tonGiao);
    }

    public TonGiao update(Integer id, TonGiao tonGiao) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        getById(id);
        validateTonGiao(tonGiao);
        tonGiao.setId(id);
        return tonGiaoRepository.save(tonGiao);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        tonGiaoRepository.deleteById(id);
    }
}
