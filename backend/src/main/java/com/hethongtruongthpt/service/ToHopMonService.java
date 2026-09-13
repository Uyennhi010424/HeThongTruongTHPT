package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.tohopmon.ToHopMonDTO;
import com.hethongtruongthpt.entity.ChiTietToHop;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.entity.ToHopMon;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.ChiTietToHopRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.MonHocRepository;
import com.hethongtruongthpt.repository.ToHopMonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ToHopMonService {
    private static final Logger log = LoggerFactory.getLogger(ToHopMonService.class);

    private final ToHopMonRepository toHopMonRepository;
    private final ChiTietToHopRepository chiTietToHopRepository;
    private final MonHocRepository monHocRepository;
    private final LopHocRepository lopHocRepository;

    public ToHopMonService(ToHopMonRepository toHopMonRepository,
                           ChiTietToHopRepository chiTietToHopRepository,
                           MonHocRepository monHocRepository,
                           LopHocRepository lopHocRepository) {
        this.toHopMonRepository = toHopMonRepository;
        this.chiTietToHopRepository = chiTietToHopRepository;
        this.monHocRepository = monHocRepository;
        this.lopHocRepository = lopHocRepository;
    }

    public List<ToHopMonDTO> getAll() {
        return toHopMonRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ToHopMonDTO getById(Integer id) {
        ToHopMon toHop = toHopMonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tổ hợp môn"));
        return toDTO(toHop);
    }

    private static final java.util.regex.Pattern TO_HOP_CODE_PATTERN =
            java.util.regex.Pattern.compile("^[A-Za-z0-9_-]+$");
    private static final java.util.regex.Pattern TO_HOP_NAME_PATTERN =
            java.util.regex.Pattern.compile("^[A-ZÀ-Ỹa-zà-ỹ0-9\\s(),\\.-]+$");
    private static final java.util.regex.Pattern TO_HOP_BAN_PATTERN =
            java.util.regex.Pattern.compile("^[A-Za-zÀ-ỹĐđ0-9\\s-]+$");

    @Transactional
    public ToHopMonDTO create(ToHopMonDTO dto) {
        if (dto.getMaToHop() == null || dto.getMaToHop().isBlank()) {
            throw new ApiException("Mã tổ hợp không được để trống");
        }
        if (dto.getTenToHop() == null || dto.getTenToHop().isBlank()) {
            throw new ApiException("Tên tổ hợp không được để trống");
        }
        if (dto.getBan() == null || dto.getBan().isBlank()) {
            throw new ApiException("Ban không được để trống");
        }

        String maToHop = dto.getMaToHop().trim().toUpperCase();
        if (!TO_HOP_CODE_PATTERN.matcher(maToHop).matches()) {
            throw new ApiException("Mã tổ hợp chỉ được chứa chữ cái, chữ số, gạch ngang và gạch dưới (vd: KHTN01, KHXH_02)");
        }
        if (toHopMonRepository.existsByMaToHop(maToHop)) {
            throw new ApiException("Mã tổ hợp đã tồn tại");
        }

        String tenToHop = dto.getTenToHop().trim();
        if (!TO_HOP_NAME_PATTERN.matcher(tenToHop).matches()) {
            throw new ApiException("Tên tổ hợp môn không được chứa ký tự đặc biệt không hợp lệ");
        }

        String ban = dto.getBan().trim();
        if (!TO_HOP_BAN_PATTERN.matcher(ban).matches()) {
            throw new ApiException("Tên ban không được chứa ký tự đặc biệt");
        }

        List<ToHopMon> allToHop = toHopMonRepository.findAll();
        for (ToHopMon th : allToHop) {
            if (th.getTenToHop() != null && th.getTenToHop().trim().equalsIgnoreCase(tenToHop)) {
                throw new ApiException("Tên tổ hợp môn '" + tenToHop + "' đã tồn tại");
            }
        }

        // Kiểm tra trùng bộ 4 môn học với tổ hợp đã có
        if (dto.getMonHocIds() != null && !dto.getMonHocIds().isEmpty()) {
            java.util.Set<Integer> newMonSet = new java.util.HashSet<>(dto.getMonHocIds());
            for (ToHopMon th : allToHop) {
                List<ChiTietToHop> chiTiets = chiTietToHopRepository.findByToHopMonId(th.getId());
                java.util.Set<Integer> existingMonSet = chiTiets.stream()
                        .map(ct -> ct.getMonHoc().getId())
                        .collect(Collectors.toSet());
                if (existingMonSet.size() == newMonSet.size() && existingMonSet.equals(newMonSet)) {
                    throw new ApiException("Tổ hợp 4 môn này đã tồn tại (trùng với tổ hợp " + th.getMaToHop() + " - " + th.getTenToHop() + ")");
                }
            }
        }

        ToHopMon toHop = new ToHopMon();
        toHop.setMaToHop(maToHop);
        toHop.setTenToHop(tenToHop);
        toHop.setBan(ban);
        toHop.setMoTa(dto.getMoTa());
        toHop.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        toHop = toHopMonRepository.save(toHop);

        // Thêm chi tiết tổ hợp
        if (dto.getMonHocIds() != null && !dto.getMonHocIds().isEmpty()) {
            saveChiTiet(toHop.getId(), dto.getMonHocIds(), dto.getSoTiets());
        }

        log.info("Tạo tổ hợp môn: {} - {}", toHop.getMaToHop(), toHop.getTenToHop());
        return toDTO(toHop);
    }

    @Transactional
    public ToHopMonDTO update(Integer id, ToHopMonDTO dto) {
        ToHopMon existing = toHopMonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tổ hợp môn"));

        List<ToHopMon> otherToHop = toHopMonRepository.findAll().stream()
                .filter(th -> !th.getId().equals(id))
                .collect(Collectors.toList());

        if (dto.getTenToHop() != null && !dto.getTenToHop().isBlank()) {
            String tenToHop = dto.getTenToHop().trim();
            if (!TO_HOP_NAME_PATTERN.matcher(tenToHop).matches()) {
                throw new ApiException("Tên tổ hợp môn không được chứa ký tự đặc biệt không hợp lệ");
            }
            for (ToHopMon th : otherToHop) {
                if (th.getTenToHop() != null && th.getTenToHop().trim().equalsIgnoreCase(tenToHop)) {
                    throw new ApiException("Tên tổ hợp môn '" + tenToHop + "' đã tồn tại");
                }
            }
            existing.setTenToHop(tenToHop);
        }

        if (dto.getBan() != null && !dto.getBan().isBlank()) {
            String ban = dto.getBan().trim();
            if (!TO_HOP_BAN_PATTERN.matcher(ban).matches()) {
                throw new ApiException("Tên ban không được chứa ký tự đặc biệt");
            }
            existing.setBan(ban);
        }

        // Kiểm tra trùng bộ 4 môn học với các tổ hợp khác
        if (dto.getMonHocIds() != null && !dto.getMonHocIds().isEmpty()) {
            java.util.Set<Integer> newMonSet = new java.util.HashSet<>(dto.getMonHocIds());
            for (ToHopMon th : otherToHop) {
                List<ChiTietToHop> chiTiets = chiTietToHopRepository.findByToHopMonId(th.getId());
                java.util.Set<Integer> existingMonSet = chiTiets.stream()
                        .map(ct -> ct.getMonHoc().getId())
                        .collect(Collectors.toSet());
                if (existingMonSet.size() == newMonSet.size() && existingMonSet.equals(newMonSet)) {
                    throw new ApiException("Tổ hợp 4 môn này đã tồn tại (trùng với tổ hợp " + th.getMaToHop() + " - " + th.getTenToHop() + ")");
                }
            }
        }

        if (dto.getBan() != null && !dto.getBan().isBlank()) {
            existing.setBan(dto.getBan().trim());
        }
        if (dto.getMoTa() != null) {
            existing.setMoTa(dto.getMoTa());
        }
        if (dto.getIsActive() != null) {
            existing.setIsActive(dto.getIsActive());
        }

        existing = toHopMonRepository.save(existing);

        // Cập nhật chi tiết tổ hợp nếu có
        if (dto.getMonHocIds() != null) {
            chiTietToHopRepository.deleteByToHopMonId(id);
            chiTietToHopRepository.flush();
            if (!dto.getMonHocIds().isEmpty()) {
                saveChiTiet(id, dto.getMonHocIds(), dto.getSoTiets());
            }
        }

        log.info("Cập nhật tổ hợp môn: ID={}", id);
        return toDTO(existing);
    }

    @Transactional
    public void delete(Integer id) {
        ToHopMon toHop = toHopMonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tổ hợp môn"));

        // Kiểm tra có lớp nào đang dùng không
        long lopUsing = lopHocRepository.countByToHop_Id(id);
        if (lopUsing > 0) {
            throw new ApiException("Không thể xóa tổ hợp môn đang được sử dụng bởi " + lopUsing + " lớp học");
        }

        chiTietToHopRepository.deleteByToHopMonId(id);
        toHopMonRepository.delete(toHop);
        log.info("Xóa tổ hợp môn: {} - {}", toHop.getMaToHop(), toHop.getTenToHop());
    }

    private void saveChiTiet(Integer toHopId, List<Integer> monHocIds, List<Integer> soTiets) {
        ToHopMon toHop = toHopMonRepository.findById(toHopId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tổ hợp môn"));

        for (int i = 0; i < monHocIds.size(); i++) {
            Integer monHocId = monHocIds.get(i);
            MonHoc monHoc = monHocRepository.findById(monHocId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học ID: " + monHocId));

            ChiTietToHop ct = new ChiTietToHop();
            ct.setToHopMon(toHop);
            ct.setMonHoc(monHoc);
            
            Integer soTiet = 2; // Mặc định
            if (soTiets != null && i < soTiets.size() && soTiets.get(i) != null) {
                soTiet = soTiets.get(i);
            }
            ct.setSoTiet(soTiet);
            
            chiTietToHopRepository.save(ct);
        }
    }

    private ToHopMonDTO toDTO(ToHopMon toHop) {
        ToHopMonDTO dto = new ToHopMonDTO();
        dto.setId(toHop.getId());
        dto.setMaToHop(toHop.getMaToHop());
        dto.setTenToHop(toHop.getTenToHop());
        dto.setBan(toHop.getBan());
        dto.setMoTa(toHop.getMoTa());
        dto.setIsActive(toHop.getIsActive());

        // Lấy danh sách môn học trong tổ hợp
        List<ChiTietToHop> chiTiets = chiTietToHopRepository.findByToHopMonId(toHop.getId());
        dto.setMonHocIds(chiTiets.stream()
                .map(ct -> ct.getMonHoc().getId())
                .collect(Collectors.toList()));
        dto.setTenMonHocs(chiTiets.stream()
                .map(ct -> ct.getMonHoc().getTenMon())
                .collect(Collectors.toList()));
        dto.setSoTiets(chiTiets.stream()
                .map(ct -> ct.getSoTiet() != null ? ct.getSoTiet() : 2)
                .collect(Collectors.toList()));

        // Đếm số lớp đang dùng tổ hợp này
        List<com.hethongtruongthpt.entity.LopHoc> lops = lopHocRepository.findByToHop_Id(toHop.getId());
        dto.setSoLopSuDung(lops.size());
        dto.setDanhSachLop(lops.stream()
                .map(com.hethongtruongthpt.entity.LopHoc::getTenLop)
                .collect(Collectors.toList()));

        return dto;
    }
}
