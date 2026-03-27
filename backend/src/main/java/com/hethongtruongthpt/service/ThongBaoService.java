package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.ThongBao;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.ThongBaoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ThongBaoService {
    private final ThongBaoRepository thongBaoRepository;

    public ThongBaoService(ThongBaoRepository thongBaoRepository) {
        this.thongBaoRepository = thongBaoRepository;
    }

    public List<ThongBao> getAll() {
        return thongBaoRepository.findAll();
    }

    public ThongBao getById(Long id) {
        return thongBaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));
    }

    public ThongBao create(ThongBao thongBao) {
        return thongBaoRepository.save(thongBao);
    }

    public ThongBao update(Long id, ThongBao thongBao) {
        getById(id);
        thongBao.setId(id);
        return thongBaoRepository.save(thongBao);
    }

    public void delete(Long id) {
        thongBaoRepository.deleteById(id);
    }
}