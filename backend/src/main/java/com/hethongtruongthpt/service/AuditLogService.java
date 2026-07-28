package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.diem.DiemAuditLogDTO;
import com.hethongtruongthpt.entity.DiemAuditLog;
import com.hethongtruongthpt.entity.UserAuditLog;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.repository.DiemAuditLogRepository;
import com.hethongtruongthpt.repository.UserAuditLogRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogService {
    private final DiemAuditLogRepository diemAuditLogRepository;
    private final UserAuditLogRepository userAuditLogRepository;
    private final GiaoVienRepository giaoVienRepository;
    private final HocSinhRepository hocSinhRepository;

    public AuditLogService(DiemAuditLogRepository diemAuditLogRepository,
                           UserAuditLogRepository userAuditLogRepository,
                           GiaoVienRepository giaoVienRepository,
                           HocSinhRepository hocSinhRepository) {
        this.diemAuditLogRepository = diemAuditLogRepository;
        this.userAuditLogRepository = userAuditLogRepository;
        this.giaoVienRepository = giaoVienRepository;
        this.hocSinhRepository = hocSinhRepository;
    }

    @Transactional(readOnly = true)
    public List<DiemAuditLogDTO> getAll() {
        List<DiemAuditLogDTO> list = diemAuditLogRepository.findAllWithDetails().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        List<DiemAuditLogDTO> userLogs = userAuditLogRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        list.addAll(userLogs);
        list.sort(Comparator.comparing(DiemAuditLogDTO::getThoiGian).reversed());
        return list;
    }

    @Transactional(readOnly = true)
    public List<DiemAuditLogDTO> getByDiemId(Integer diemId) {
        return diemAuditLogRepository.findByDiemIdWithDetails(diemId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DiemAuditLogDTO> getByHocSinhId(Integer hocSinhId, Integer monHocId) {
        List<DiemAuditLogDTO> list = diemAuditLogRepository.findByHocSinhIdWithDetails(hocSinhId, monHocId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        
        if (monHocId == null) {
            HocSinh hs = hocSinhRepository.findById(hocSinhId).orElse(null);
            if (hs != null && hs.getUser() != null) {
                List<DiemAuditLogDTO> userLogs = userAuditLogRepository.findByUserIdOrderByTimestampDesc(hs.getUser().getId()).stream()
                        .map(this::toDTO)
                        .collect(Collectors.toList());
                list.addAll(userLogs);
                list.sort(Comparator.comparing(DiemAuditLogDTO::getThoiGian).reversed());
            }
        }
        return list;
    }

    @Transactional(readOnly = true)
    public List<DiemAuditLogDTO> getByGiaoVienId(Integer giaoVienId) {
        List<DiemAuditLogDTO> list = diemAuditLogRepository.findByGiaoVienIdWithDetails(giaoVienId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        GiaoVien gv = giaoVienRepository.findById(giaoVienId).orElse(null);
        if (gv != null && gv.getUser() != null) {
            List<DiemAuditLogDTO> userLogs = userAuditLogRepository.findByUserIdOrderByTimestampDesc(gv.getUser().getId()).stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
            list.addAll(userLogs);
            list.sort(Comparator.comparing(DiemAuditLogDTO::getThoiGian).reversed());
        }
        return list;
    }

    @Transactional(readOnly = true)
    public List<DiemAuditLogDTO> getFiltered(Integer giaoVienId, LocalDateTime startDate, LocalDateTime endDate) {
        List<DiemAuditLogDTO> list = diemAuditLogRepository.findFilteredWithDetails(giaoVienId, startDate, endDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        Integer userId = null;
        if (giaoVienId != null) {
            GiaoVien gv = giaoVienRepository.findById(giaoVienId).orElse(null);
            if (gv != null && gv.getUser() != null) {
                userId = gv.getUser().getId();
            } else {
                // If filter by non-existent giaoVien, user log will be empty
                userId = -1; 
            }
        }

        List<DiemAuditLogDTO> userLogs = userAuditLogRepository.findFiltered(userId, startDate, endDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        list.addAll(userLogs);
        list.sort(Comparator.comparing(DiemAuditLogDTO::getThoiGian).reversed());
        return list;
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

    private DiemAuditLogDTO toDTO(UserAuditLog entity) {
        DiemAuditLogDTO dto = new DiemAuditLogDTO();
        dto.setId(-entity.getId()); // Use negative ID to avoid collision with DiemAuditLog
        dto.setHanhDong(entity.getAction());
        dto.setThoiGian(entity.getTimestamp());
        dto.setLyDo(entity.getDetails());
        dto.setIpAddress(entity.getIpAddress());

        if (entity.getUser() != null) {
            String role = entity.getUser().getRole() != null ? entity.getUser().getRole().name() : "";
            if ("GIAO_VIEN".equals(role)) {
                GiaoVien gv = giaoVienRepository.findByUserId(entity.getUser().getId()).orElse(null);
                if (gv != null) {
                    dto.setGiaoVienId(gv.getId());
                    dto.setHoTenGiaoVien(gv.getHoTen());
                    dto.setGiaoVien(new DiemAuditLogDTO.GiaoVienInfo(gv.getId(), gv.getHoTen()));
                }
            } else if ("HOC_SINH".equals(role)) {
                HocSinh hs = hocSinhRepository.findByUserId(entity.getUser().getId()).orElse(null);
                if (hs != null) {
                    dto.setHocSinhId(hs.getId());
                    dto.setHoTenHocSinh(hs.getHoTen());
                    dto.setHocSinh(new DiemAuditLogDTO.HocSinhInfo(hs.getId(), hs.getHoTen()));
                }
            } else if ("ADMIN".equals(role)) {
                dto.setHoTenGiaoVien("Admin (" + entity.getUser().getUsername() + ")");
                dto.setGiaoVien(new DiemAuditLogDTO.GiaoVienInfo(0, "Admin (" + entity.getUser().getUsername() + ")"));
            }
        }
        return dto;
    }
}
