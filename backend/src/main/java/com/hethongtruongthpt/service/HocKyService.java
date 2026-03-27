package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.HocKy;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.HocKyRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HocKyService {
    private final HocKyRepository hocKyRepository;

    public HocKyService(HocKyRepository hocKyRepository) {
        this.hocKyRepository = hocKyRepository;
    }

    public List<HocKy> getAll() {
        return hocKyRepository.findAll();
    }

    public HocKy getById(Long id) {
        return hocKyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ"));
    }

    public HocKy create(HocKy hocKy) {
        if (hocKy.getId() == null) {
            Long maxId = hocKyRepository.findMaxId();
            hocKy.setId(maxId + 1);
        }
        return hocKyRepository.save(hocKy);
    }

    public HocKy update(Long id, HocKy hocKy) {
        getById(id);
        hocKy.setId(id);
        return hocKyRepository.save(hocKy);
    }

    public void delete(Long id) {
        hocKyRepository.deleteById(id);
    }
}
