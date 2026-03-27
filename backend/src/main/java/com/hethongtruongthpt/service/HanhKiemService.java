package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.HanhKiem;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.HanhKiemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HanhKiemService {
    private final HanhKiemRepository hanhKiemRepository;

    public HanhKiemService(HanhKiemRepository hanhKiemRepository) {
        this.hanhKiemRepository = hanhKiemRepository;
    }

    public List<HanhKiem> getAll() {
        return hanhKiemRepository.findAll();
    }

    public HanhKiem getById(Long id) {
        return hanhKiemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hạnh kiểm"));
    }

    public HanhKiem create(HanhKiem hanhKiem) {
        return hanhKiemRepository.save(hanhKiem);
    }

    public HanhKiem update(Long id, HanhKiem hanhKiem) {
        getById(id);
        hanhKiem.setId(id);
        return hanhKiemRepository.save(hanhKiem);
    }

    public void delete(Long id) {
        hanhKiemRepository.deleteById(id);
    }
}