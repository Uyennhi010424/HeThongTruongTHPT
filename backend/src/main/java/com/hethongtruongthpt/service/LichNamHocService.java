package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.LichNamHoc;
import com.hethongtruongthpt.repository.LichNamHocRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LichNamHocService {
    private final LichNamHocRepository repository;

    public LichNamHocService(LichNamHocRepository repository) {
        this.repository = repository;
    }

    public List<LichNamHoc> getHolidays() {
        return repository.findByNgayHocFalse();
    }
}
