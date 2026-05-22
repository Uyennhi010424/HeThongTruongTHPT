package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.DanToc;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.DanTocRepository;
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

    public DanToc getById(Integer id) {
        return danTocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dân tộc"));
    }

    public DanToc create(DanToc danToc) {
        return danTocRepository.save(danToc);
    }

    public DanToc update(Integer id, DanToc danToc) {
        getById(id);
        danToc.setId(id);
        return danTocRepository.save(danToc);
    }

    public void delete(Integer id) {
        danTocRepository.deleteById(id);
    }
}
