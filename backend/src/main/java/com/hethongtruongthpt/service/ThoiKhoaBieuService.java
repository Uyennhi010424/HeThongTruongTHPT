package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.ThoiKhoaBieuRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ThoiKhoaBieuService {
    private final ThoiKhoaBieuRepository thoiKhoaBieuRepository;

    public ThoiKhoaBieuService(ThoiKhoaBieuRepository thoiKhoaBieuRepository) {
        this.thoiKhoaBieuRepository = thoiKhoaBieuRepository;
    }

    public List<ThoiKhoaBieu> getAll() {
        return thoiKhoaBieuRepository.findAll();
    }

    public ThoiKhoaBieu getById(Long id) {
        return thoiKhoaBieuRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thời khóa biểu"));
    }

    public ThoiKhoaBieu create(ThoiKhoaBieu thoiKhoaBieu) {
        return thoiKhoaBieuRepository.save(thoiKhoaBieu);
    }

    public ThoiKhoaBieu update(Long id, ThoiKhoaBieu thoiKhoaBieu) {
        getById(id);
        thoiKhoaBieu.setId(id);
        return thoiKhoaBieuRepository.save(thoiKhoaBieu);
    }

    public void delete(Long id) {
        thoiKhoaBieuRepository.deleteById(id);
    }
}