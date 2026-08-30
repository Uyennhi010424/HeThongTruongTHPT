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

    public TonGiao create(TonGiao tonGiao) {
        if (tonGiao == null) throw new IllegalArgumentException("Tôn giáo không được để trống");
        return tonGiaoRepository.save(tonGiao);
    }

    public TonGiao update(Integer id, TonGiao tonGiao) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        getById(id);
        tonGiao.setId(id);
        return tonGiaoRepository.save(tonGiao);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        tonGiaoRepository.deleteById(id);
    }
}
