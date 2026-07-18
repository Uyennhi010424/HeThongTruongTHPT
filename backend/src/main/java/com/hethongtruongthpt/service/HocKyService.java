package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.HocKy;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.HocKyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    public Page<HocKy> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("tenHocKy").ascending());
        return hocKyRepository.findAll(pageable);
    }

    public HocKy getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return hocKyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ"));
    }

    @SuppressWarnings("null")
    public HocKy create(HocKy hocKy) {
        return hocKyRepository.save(hocKy);
    }

    public HocKy update(Integer id, HocKy hocKy) {
        getById(id);
        hocKy.setId(id);
        return hocKyRepository.save(hocKy);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        hocKyRepository.deleteById(id);
    }
}
