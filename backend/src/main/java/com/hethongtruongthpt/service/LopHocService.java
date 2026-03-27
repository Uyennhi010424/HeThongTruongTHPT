package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.LopHocRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LopHocService {
    private final LopHocRepository lopHocRepository;

    public LopHocService(LopHocRepository lopHocRepository) {
        this.lopHocRepository = lopHocRepository;
    }

    public List<LopHoc> getAll() {
        return lopHocRepository.findAll();
    }

    public LopHoc getById(Long id) {
        return lopHocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
    }

    public LopHoc create(LopHoc lopHoc) {
        validateLopHoc(lopHoc);
        return lopHocRepository.save(lopHoc);
    }

    public LopHoc update(Long id, LopHoc lopHoc) {
        getById(id);
        validateLopHoc(lopHoc);
        lopHoc.setId(id);
        return lopHocRepository.save(lopHoc);
    }

    public void delete(Long id) {
        lopHocRepository.deleteById(id);
    }

    private void validateLopHoc(LopHoc lopHoc) {
        String tenLop = lopHoc.getTenLop() != null ? lopHoc.getTenLop().trim() : "";
        String khoi = lopHoc.getKhoi() != null ? lopHoc.getKhoi().trim() : "";

        if (tenLop.isBlank()) {
            throw new ApiException("Tên lớp không được để trống");
        }
        if (khoi.isBlank()) {
            throw new ApiException("Khối không được để trống");
        }

        String gradeFromName = extractGradePrefix(tenLop);
        if (gradeFromName == null) {
            throw new ApiException("Tên lớp phải bắt đầu bằng 10, 11 hoặc 12");
        }
        if (!gradeFromName.equals(khoi)) {
            throw new ApiException("Tên lớp không khớp với khối đã chọn");
        }
    }

    private String extractGradePrefix(String tenLop) {
        if (tenLop.startsWith("10")) return "10";
        if (tenLop.startsWith("11")) return "11";
        if (tenLop.startsWith("12")) return "12";
        return null;
    }
}