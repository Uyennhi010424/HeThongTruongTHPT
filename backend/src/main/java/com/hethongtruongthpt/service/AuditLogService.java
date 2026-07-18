package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.diem.DiemAuditLogDTO;
import com.hethongtruongthpt.entity.DiemAuditLog;
import com.hethongtruongthpt.repository.DiemAuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogService {
    private final DiemAuditLogRepository diemAuditLogRepository;

    public AuditLogService(DiemAuditLogRepository diemAuditLogRepository) {
        this.diemAuditLogRepository = diemAuditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<DiemAuditLogDTO> getAll() {
        return diemAuditLogRepository.findAllWithDetails().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DiemAuditLogDTO> getByDiemId(Integer diemId) {
        return diemAuditLogRepository.findByDiemIdWithDetails(diemId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DiemAuditLogDTO> getByHocSinhId(Integer hocSinhId, Integer monHocId) {
        return diemAuditLogRepository.findByHocSinhIdWithDetails(hocSinhId, monHocId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DiemAuditLogDTO> getByGiaoVienId(Integer giaoVienId) {
        return diemAuditLogRepository.findByGiaoVienIdWithDetails(giaoVienId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DiemAuditLogDTO> getFiltered(Integer giaoVienId, LocalDateTime startDate, LocalDateTime endDate) {
        return diemAuditLogRepository.findFilteredWithDetails(giaoVienId, startDate, endDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private DiemAuditLogDTO toDTO(DiemAuditLog entity) {
        DiemAuditLogDTO dto = new DiemAuditLogDTO();
        dto.setId(entity.getId());
        dto.setGiaTriCu(entity.getGiaTriCu());
        dto.setGiaTriMoi(entity.getGiaTriMoi());
        dto.setHanhDong(entity.getHanhDong());
        dto.setThoiGian(entity.getThoiGian());
        dto.setLyDo(entity.getLyDo());
        dto.setIpAddress(entity.getIpAddress());

        try {
            if (entity.getDiem() != null) {
                dto.setDiemId(entity.getDiem().getId());
            }
        } catch (Exception ignored) {}

        try {
            if (entity.getHocSinh() != null) {
                dto.setHocSinhId(entity.getHocSinh().getId());
                dto.setHoTenHocSinh(entity.getHocSinh().getHoTen());
                dto.setHocSinh(new DiemAuditLogDTO.HocSinhInfo(
                    entity.getHocSinh().getId(), entity.getHocSinh().getHoTen()));
            }
        } catch (Exception ignored) {}

        try {
            if (entity.getMonHoc() != null) {
                dto.setMonHocId(entity.getMonHoc().getId());
                dto.setTenMonHoc(entity.getMonHoc().getTenMon());
                dto.setMonHoc(new DiemAuditLogDTO.MonHocInfo(
                    entity.getMonHoc().getId(), entity.getMonHoc().getTenMon()));
            }
        } catch (Exception ignored) {}

        try {
            if (entity.getGiaoVien() != null) {
                dto.setGiaoVienId(entity.getGiaoVien().getId());
                dto.setHoTenGiaoVien(entity.getGiaoVien().getHoTen());
                dto.setGiaoVien(new DiemAuditLogDTO.GiaoVienInfo(
                    entity.getGiaoVien().getId(), entity.getGiaoVien().getHoTen()));
            }
        } catch (Exception ignored) {}

        return dto;
    }
}
