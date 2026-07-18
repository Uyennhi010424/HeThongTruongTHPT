package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.HanhKiemRepository;
import com.hethongtruongthpt.repository.HocBaRepository;
import com.hethongtruongthpt.repository.HocKyRepository;
import com.hethongtruongthpt.repository.NamHocRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NamHocService {
    private final NamHocRepository namHocRepository;
    private final HocKyRepository hocKyRepository;
    private final HanhKiemRepository hanhKiemRepository;
    private final HocBaRepository hocBaRepository;

    public NamHocService(NamHocRepository namHocRepository, HocKyRepository hocKyRepository,
                         HanhKiemRepository hanhKiemRepository, HocBaRepository hocBaRepository) {
        this.namHocRepository = namHocRepository;
        this.hocKyRepository = hocKyRepository;
        this.hanhKiemRepository = hanhKiemRepository;
        this.hocBaRepository = hocBaRepository;
    }

    public List<NamHoc> getAll() {
        return namHocRepository.findAll();
    }

    public Page<NamHoc> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("tenNamHoc").descending());
        return namHocRepository.findAll(pageable);
    }

    public NamHoc getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return namHocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy năm học"));
    }

    public NamHoc create(NamHoc namHoc) {
        namHoc.setId(null); // Để MySQL tự tăng ID
        return namHocRepository.save(namHoc);
    }

    public NamHoc update(Integer id, NamHoc namHoc) {
        getById(id);
        namHoc.setId(id);
        return namHocRepository.save(namHoc);
    }

    @Transactional
    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        getById(id);

        // Kiểm tra hạnh kiểm liên quan
        if (hanhKiemRepository.existsByNamHocId(id)) {
            throw new ApiException("Không thể xóa năm học có dữ liệu hạnh kiểm.");
        }

        // Kiểm tra học bạ liên quan
        if (hocBaRepository.existsByNamHocId(id)) {
            throw new ApiException("Không thể xóa năm học có dữ liệu học bạ.");
        }

        // Xóa học kỳ trước khi xóa năm học
        if (hocKyRepository.existsByNamHocId(id)) {
            hocKyRepository.deleteByNamHocId(id);
        }

        namHocRepository.deleteById(id);
    }
}
