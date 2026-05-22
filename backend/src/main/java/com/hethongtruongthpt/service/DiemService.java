package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.DiemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DiemService {
    private final DiemRepository diemRepository;

    public DiemService(DiemRepository diemRepository) {
        this.diemRepository = diemRepository;
    }

    public List<Diem> getAll() {
        return diemRepository.findAll();
    }

    public Diem getById(Integer id) {
        return diemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy điểm"));
    }

    public Diem create(Diem diem) {
        return diemRepository.save(diem);
    }

    public Diem update(Integer id, Diem diem) {
        getById(id);
        diem.setId(id);
        return diemRepository.save(diem);
    }

    public void delete(Integer id) {
        diemRepository.deleteById(id);
    }
}