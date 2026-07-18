package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.DanToc;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.DanTocRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DanTocService {
    private final DanTocRepository danTocRepository;

    public DanTocService(DanTocRepository danTocRepository) {
        this.danTocRepository = danTocRepository;
    }

    public List<DanToc> getAll() {
        return danTocRepository.findAll();
    }

    public Page<DanToc> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("tenDanToc").ascending());
        return danTocRepository.findAll(pageable);
    }

    public DanToc getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return danTocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dân tộc"));
    }

    public DanToc create(DanToc danToc) {
        if (danToc == null) throw new IllegalArgumentException("Dân tộc không được để trống");
        return danTocRepository.save(danToc);
    }

    public DanToc update(Integer id, DanToc danToc) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        getById(id);
        danToc.setId(id);
        return danTocRepository.save(danToc);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        danTocRepository.deleteById(id);
    }
}
