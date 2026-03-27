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

    public ChuNhiemDTO getByGiaoVienId(Long giaoVienId) {
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
    public ChuNhiemDTO assignByGiaoVienId(Long giaoVienId, Long lopId) {
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

        // Mỗi giáo viên chỉ chủ nhiệm 1 lớp và mỗi lớp chỉ có 1 GVCN.
        chuNhiemRepository.deleteById_GiaoVienId(giaoVienId);
        chuNhiemRepository.deleteById_LopId(lopId);

        ChuNhiemId id = new ChuNhiemId();
        id.setGiaoVienId(giaoVienId);
        id.setLopId(lopId);

        ChuNhiem assignment = new ChuNhiem();
        assignment.setId(id);

        ChuNhiem saved = chuNhiemRepository.save(assignment);
        return toDto(saved);
    }

    @Transactional
    public void clearByGiaoVienId(Long giaoVienId) {
        chuNhiemRepository.deleteById_GiaoVienId(giaoVienId);
    }

    private ChuNhiemDTO toDto(ChuNhiem entity) {
        ChuNhiemDTO dto = new ChuNhiemDTO();
        dto.setGiaoVienId(entity.getId().getGiaoVienId());
        dto.setLopId(entity.getId().getLopId());
        return dto;
    }
}
