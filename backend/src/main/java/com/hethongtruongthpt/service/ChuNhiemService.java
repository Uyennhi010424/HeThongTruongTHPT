package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.chunhiem.ChuNhiemDTO;
import com.hethongtruongthpt.entity.ChuNhiem;
import com.hethongtruongthpt.entity.ChuNhiemId;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.ChuNhiemRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChuNhiemService {
    private static final Logger logger = LoggerFactory.getLogger(ChuNhiemService.class);
    private final ChuNhiemRepository chuNhiemRepository;
    private final GiaoVienRepository giaoVienRepository;
    private final LopHocRepository lopHocRepository;

    public ChuNhiemService(
            ChuNhiemRepository chuNhiemRepository,
            GiaoVienRepository giaoVienRepository,
            LopHocRepository lopHocRepository
    ) {
        this.chuNhiemRepository = chuNhiemRepository;
        this.giaoVienRepository = giaoVienRepository;
        this.lopHocRepository = lopHocRepository;
    }

    public List<ChuNhiemDTO> getAll() {
        try {
            return chuNhiemRepository.findAll().stream().map(this::toDto).toList();
        } catch (Exception ex) {
            logger.error("Không thể tải danh sách chủ nhiệm", ex);
            return List.of();
        }
    }

    public Page<ChuNhiemDTO> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chuNhiemRepository.findAll(pageable).map(this::toDto);
    }

    public ChuNhiemDTO getByGiaoVienId(Integer giaoVienId) {
        try {
            return chuNhiemRepository.findById_GiaoVienId(giaoVienId).stream()
                    .findFirst()
                    .map(this::toDto)
                    .orElse(null);
        } catch (Exception ex) {
            logger.error("Không thể tải chủ nhiệm theo giáo viên id={}", giaoVienId, ex);
            return null;
        }
    }

    @Transactional
    public ChuNhiemDTO assignByGiaoVienId(Integer giaoVienId, Integer lopId) {
        if (giaoVienId == null) {
            throw new ResourceNotFoundException("Thiếu mã giáo viên");
        }
        if (lopId == null) {
            clearByGiaoVienId(giaoVienId);
            return null;
        }

        if (!giaoVienRepository.existsById(giaoVienId)) {
            throw new ResourceNotFoundException("Không tìm thấy giáo viên");
        }
        if (!lopHocRepository.existsById(lopId)) {
            throw new ResourceNotFoundException("Không tìm thấy lớp học");
        }

        chuNhiemRepository.deleteById_GiaoVienId(giaoVienId);
        chuNhiemRepository.deleteById_LopId(lopId);

        ChuNhiemId id = new ChuNhiemId();
        id.setGiaoVienId(giaoVienId);
        id.setLopId(lopId);

        ChuNhiem assignment = new ChuNhiem();
        assignment.setId(id);

        ChuNhiem saved = chuNhiemRepository.save(assignment);

        // Sync LopHoc.gvcn so auto-assign can find homeroom teacher
        giaoVienRepository.findById(giaoVienId).ifPresent(gv -> {
            lopHocRepository.findById(lopId).ifPresent(lop -> {
                lop.setGvcn(gv);
                lopHocRepository.save(lop);
            });
        });

        return toDto(saved);
    }

    @Transactional
    public void clearByGiaoVienId(Integer giaoVienId) {
        if (giaoVienId == null) return;
        // Clear LopHoc.gvcn for classes where this teacher was GVCN
        chuNhiemRepository.findById_GiaoVienId(giaoVienId).forEach(cn -> {
            Integer lopId = cn.getId().getLopId();
            if (lopId == null) return;
            lopHocRepository.findById(lopId).ifPresent(lop -> {
                if (lop.getGvcn() != null && lop.getGvcn().getId() != null && lop.getGvcn().getId().equals(giaoVienId)) {
                    lop.setGvcn(null);
                    lopHocRepository.save(lop);
                }
            });
        });
        chuNhiemRepository.deleteById_GiaoVienId(giaoVienId);
    }

    private ChuNhiemDTO toDto(ChuNhiem entity) {
        ChuNhiemDTO dto = new ChuNhiemDTO();
        dto.setGiaoVienId(entity.getId().getGiaoVienId());
        dto.setLopId(entity.getId().getLopId());
        return dto;
    }
}