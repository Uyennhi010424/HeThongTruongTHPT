package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.MonHocRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MonHocService {
    private final MonHocRepository monHocRepository;

    public MonHocService(MonHocRepository monHocRepository) {
        this.monHocRepository = monHocRepository;
    }

    public List<MonHoc> getAll() {
        return monHocRepository.findAll();
    }

    public MonHoc getById(Long id) {
        return monHocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học"));
    }

    public MonHoc create(MonHoc monHoc) {
        return monHocRepository.save(monHoc);
    }

    public MonHoc update(Long id, MonHoc monHoc) {
        getById(id);
        monHoc.setId(id);
        return monHocRepository.save(monHoc);
    }

    public void delete(Long id) {
        monHocRepository.deleteById(id);
    }
}