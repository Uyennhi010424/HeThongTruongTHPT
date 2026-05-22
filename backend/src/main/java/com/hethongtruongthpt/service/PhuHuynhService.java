package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.PhuHuynhRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PhuHuynhService {
    private final PhuHuynhRepository phuHuynhRepository;

    public PhuHuynhService(PhuHuynhRepository phuHuynhRepository) {
        this.phuHuynhRepository = phuHuynhRepository;
    }

    public List<PhuHuynh> getAll() {
        return phuHuynhRepository.findAll();
    }

    public PhuHuynh getById(Integer id) {
        return phuHuynhRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phụ huynh"));
    }

    public PhuHuynh create(PhuHuynh phuHuynh) {
        return phuHuynhRepository.save(phuHuynh);
    }

    public PhuHuynh update(Integer id, PhuHuynh phuHuynh) {
        getById(id);
        phuHuynh.setId(id);
        return phuHuynhRepository.save(phuHuynh);
    }

    public void delete(Integer id) {
        phuHuynhRepository.deleteById(id);
    }
}
