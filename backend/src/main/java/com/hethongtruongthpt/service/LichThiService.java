package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.LichThi;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.LichThiRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LichThiService {
    private final LichThiRepository lichThiRepository;

    public LichThiService(LichThiRepository lichThiRepository) {
        this.lichThiRepository = lichThiRepository;
    }

    public List<LichThi> getAll() {
        return lichThiRepository.findAll();
    }

    public LichThi getById(Long id) {
        return lichThiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch thi"));
    }

    public LichThi create(LichThi lichThi) {
        return lichThiRepository.save(lichThi);
    }

    public LichThi update(Long id, LichThi lichThi) {
        getById(id);
        lichThi.setId(id);
        return lichThiRepository.save(lichThi);
    }

    public void delete(Long id) {
        lichThiRepository.deleteById(id);
    }
}