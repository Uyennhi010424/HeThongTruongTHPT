package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.NamHocRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NamHocService {
    private final NamHocRepository namHocRepository;

    public NamHocService(NamHocRepository namHocRepository) {
        this.namHocRepository = namHocRepository;
    }

    public List<NamHoc> getAll() {
        return namHocRepository.findAll();
    }

    public NamHoc getById(Integer id) {
        return namHocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy năm học"));
    }

    public NamHoc create(NamHoc namHoc) {
        if (namHoc.getId() == null) {
            Integer maxId = namHocRepository.findMaxId();
            namHoc.setId(maxId + 1);
        }
        return namHocRepository.save(namHoc);
    }

    public NamHoc update(Integer id, NamHoc namHoc) {
        getById(id);
        namHoc.setId(id);
        return namHocRepository.save(namHoc);
    }

    public void delete(Integer id) {
        namHocRepository.deleteById(id);
    }
}
