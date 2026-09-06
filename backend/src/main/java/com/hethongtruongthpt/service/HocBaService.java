package com.hethongtruongthpt.service;

import com.hethongtruongthpt.common.Utils;
import com.hethongtruongthpt.dto.HocBaDTO;
import com.hethongtruongthpt.entity.*;
import com.hethongtruongthpt.enums.HocLucEnum;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class HocBaService {
    private static final Logger log = LoggerFactory.getLogger(HocBaService.class);

    private final HocBaRepository hocBaRepository;
    private final DiemRepository diemRepository;
    private final HanhKiemRepository hanhKiemRepository;
    private final HocSinhRepository hocSinhRepository;
    private final NamHocRepository namHocRepository;

    public HocBaService(HocBaRepository hocBaRepository,
                        DiemRepository diemRepository,
                        HanhKiemRepository hanhKiemRepository,
                        HocSinhRepository hocSinhRepository,
                        NamHocRepository namHocRepository) {
        this.hocBaRepository = hocBaRepository;
        this.diemRepository = diemRepository;
        this.hanhKiemRepository = hanhKiemRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.namHocRepository = namHocRepository;
    }

    public List<HocBa> getAll() {
        return hocBaRepository.findAll();
    }

    public Page<HocBa> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return hocBaRepository.findAll(pageable);
    }

    public HocBa getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return hocBaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học bạ"));
    }

    public List<HocBa> getByHocSinhId(Integer hocSinhId) {
        return hocBaRepository.findByHocSinhId(hocSinhId);
    }

    public HocBa getByHocSinhIdAndNamHocId(Integer hocSinhId, Integer namHocId) {
        return hocBaRepository.findByHocSinhIdAndNamHocId(hocSinhId, namHocId)
                .orElse(null);
    }

    public HocBa create(HocBa hocBa) {
        if (hocBa == null) throw new IllegalArgumentException("Học bạ không được để trống");
        return hocBaRepository.save(hocBa);
    }

    public HocBa update(Integer id, HocBa hocBa) {
        getById(id);
        hocBa.setId(id);
        return hocBaRepository.save(hocBa);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        hocBaRepository.deleteById(id);
    }

    /**
     * Tính học lực cho 1 học sinh trong 1 năm học theo Thông tư 22.
     */
    private String layNhanXetCaNamMon(List<Diem> diemMon) {
        String hk1 = diemMon.stream()
                .filter(d -> d.getHocKy() != null && d.getHocKy() == 1 && "TX".equals(d.getLoaiDiem()) && d.getSoThuTu() == 0)
                .map(Diem::getNhanXet)
                .findFirst()
                .orElse(null);
        String hk2 = diemMon.stream()
                .filter(d -> d.getHocKy() != null && d.getHocKy() == 2 && "TX".equals(d.getLoaiDiem()) && d.getSoThuTu() == 0)
                .map(Diem::getNhanXet)
                .findFirst()
                .orElse(null);
        
        if (hk1 == null && hk2 == null) return null;
        if (hk1 == null) return hk2;
        if (hk2 == null) return hk1;
        return ("DAT".equals(hk1) && "DAT".equals(hk2)) ? "DAT" : "CHUA_DAT";
    }

    public HocBaDTO tinhHocLuc(Integer hocSinhId, Integer namHocId) {
        if (hocSinhId == null) throw new IllegalArgumentException("ID học sinh không được để trống");
        if (namHocId == null) throw new IllegalArgumentException("ID năm học không được để trống");
        HocSinh hocSinh = hocSinhRepository.findById(hocSinhId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
        NamHoc namHoc = namHocRepository.findById(namHocId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy năm học"));

        // Lấy tất cả điểm của học sinh trong năm học
        List<Diem> allDiem = diemRepository.findByHocSinhIdAndNamHoc(hocSinhId, namHoc.getTenNamHoc());

        // Nhóm theo môn học
        Map<Integer, List<Diem>> diemByMon = allDiem.stream()
                .filter(d -> d.getMonHoc() != null)
                .collect(Collectors.groupingBy(d -> d.getMonHoc().getId()));

        // Tính ĐTB từng môn
        List<HocBaDTO.MonDiemDTO> monDiemList = new ArrayList<>();
        List<Double> diemTBMons = new ArrayList<>();
        List<String> commentResults = new ArrayList<>();

        for (Map.Entry<Integer, List<Diem>> entry : diemByMon.entrySet()) {
            Integer monHocId = entry.getKey();
            List<Diem> diemMon = entry.getValue();

            MonHoc monHoc = diemMon.stream()
                    .map(Diem::getMonHoc)
                    .filter(m -> m != null)
                    .findFirst()
                    .orElse(null);

            if (monHoc != null && "NHAN_XET".equals(monHoc.getNhomDanhGia())) {
                String nxVal = layNhanXetCaNamMon(diemMon);
                if (nxVal != null) {
                    commentResults.add(nxVal);
                    
                    HocBaDTO.MonDiemDTO monDiem = new HocBaDTO.MonDiemDTO();
                    monDiem.setMonHocId(monHocId);
                    monDiem.setTenMonHoc(monHoc.getTenMon());
                    monDiem.setXepLoai(nxVal);
                    monDiemList.add(monDiem);
                }
            } else {
                // Tính ĐTB môn HK1 và HK2
                Double tbHK1 = tinhDiemTBMonTheoHK(diemMon, 1);
                Double tbHK2 = tinhDiemTBMonTheoHK(diemMon, 2);

                // ĐTB môn cả năm = (HK1 + 2×HK2) / 3
                Double tbCaNam = null;
                if (tbHK1 != null && tbHK2 != null) {
                    tbCaNam = Utils.round((tbHK1 + 2.0 * tbHK2) / 3.0, 2);
                }

                HocBaDTO.MonDiemDTO monDiem = new HocBaDTO.MonDiemDTO();
                monDiem.setMonHocId(monHocId);
                String tenMon = monHoc != null ? monHoc.getTenMon() : "Môn " + monHocId;
                monDiem.setTenMonHoc(tenMon);
                monDiem.setDiemTBHK1(tbHK1);
                monDiem.setDiemTBHK2(tbHK2);
                monDiem.setDiemTBCaNam(tbCaNam);
                monDiemList.add(monDiem);

                if (tbCaNam != null) {
                    diemTBMons.add(tbCaNam);
                }
            }
        }

        // Tính ĐTB cả năm (trung bình cộng ĐTB tất cả môn điểm số)
        Double diemTBCaNam = diemTBMons.isEmpty() ? null : Utils.average(diemTBMons);

        // Xếp loại học lực theo TT22
        HocLucEnum hocLuc = null;
        if (diemTBCaNam != null) {
            hocLuc = Utils.xepLoaiHocLuc(commentResults, diemTBMons);

            // Đánh dấu môn vi phạm điều kiện
            for (HocBaDTO.MonDiemDTO monDiem : monDiemList) {
                if (monDiem.getDiemTBCaNam() != null) {
                    monDiem.setXepLoai(danhGiaMon(monDiem.getDiemTBCaNam(), hocLuc));
                }
            }
        }

        // Lấy hạnh kiểm (lấy học kỳ 2 làm hạnh kiểm cả năm)
        String hanhKiem = layHanhKiemCaNam(hocSinhId, namHocId);

        // Tạo/cập nhật HocBa
        HocBa hocBa = hocBaRepository.findByHocSinhIdAndNamHocId(hocSinhId, namHocId)
                .orElseGet(() -> {
                    HocBa hb = new HocBa();
                    hb.setHocSinh(hocSinh);
                    hb.setNamHoc(namHoc);
                    return hb;
                });

        if (hocLuc != null) {
            hocBa.setHocLuc(hocLuc.name());
        }
        if (hanhKiem != null) {
            hocBa.setHanhKiem(hanhKiem);
        }
        if (diemTBCaNam != null) {
            hocBa.setDiemTBCaNam(java.math.BigDecimal.valueOf(diemTBCaNam));
        }
        if (hocBa == null) {
            throw new ResourceNotFoundException("Không thể tạo hoặc tìm thấy học bạ");
        }
        hocBaRepository.save(hocBa);

        // Build DTO
        HocBaDTO dto = new HocBaDTO();
        dto.setId(hocBa.getId());
        dto.setHocSinhId(hocSinhId);
        dto.setHoTenHocSinh(hocSinh.getHoTen());
        dto.setTenLop(hocSinh.getLop() != null ? hocSinh.getLop().getTenLop() : null);
        dto.setNamHocId(namHocId);
        dto.setTenNamHoc(namHoc.getTenNamHoc());
        dto.setHocLuc(hocLuc != null ? hocLuc.name() : null);
        dto.setHanhKiem(hanhKiem);
        dto.setGhiChu(hocBa.getGhiChu());
        dto.setDiemTBCaNam(diemTBCaNam);
        dto.setDiemTungMon(monDiemList);

        return dto;
    }

    /**
     * Tính học lực cho tất cả học sinh trong 1 lớp.
     */
    public List<HocBaDTO> tinhHocLucLop(Integer lopId, Integer namHocId) {
        List<HocSinh> hocSinhs = hocSinhRepository.findByLopId(lopId);
        if (hocSinhs.isEmpty() && namHocId != null) {
            com.hethongtruongthpt.entity.NamHoc nh = namHocRepository.findById(namHocId).orElse(null);
            if (nh != null) {
                List<Integer> hsIds = diemRepository.findDistinctHocSinhIdsByLopIdAndNamHoc(lopId, nh.getTenNamHoc());
                if (!hsIds.isEmpty()) {
                    hocSinhs = hocSinhRepository.findAllById(hsIds);
                }
            }
        }
        List<HocBaDTO> results = new ArrayList<>();
        for (HocSinh hs : hocSinhs) {
            try {
                results.add(tinhHocLuc(hs.getId(), namHocId));
            } catch (Exception e) {
                log.warn("Không thể tính học lực cho học sinh {}: {}", hs.getId(), e.getMessage());
            }
        }
        return results;
    }

    /**
     * Tính ĐTB môn theo học kỳ.
     * Công thức: (Σđiểm_TX + 2×GK + 3×CK) / (số_TX + 5)
     */
    private Double tinhDiemTBMonTheoHK(List<Diem> diemMon, int hocKy) {
        List<Diem> diemHK = diemMon.stream()
                .filter(d -> d.getHocKy() != null && d.getHocKy() == hocKy)
                .toList();

        if (diemHK.isEmpty()) return null;

        double sumTX = 0;
        int countTX = 0;
        Double gk = null;
        Double ck = null;

        for (Diem d : diemHK) {
            if (d.getGiaTriDiem() == null) continue;
            double val = d.getGiaTriDiem().doubleValue();

            if ("TX".equals(d.getLoaiDiem())) {
                sumTX += val;
                countTX++;
            } else if ("GK".equals(d.getLoaiDiem())) {
                gk = val;
            } else if ("CK".equals(d.getLoaiDiem())) {
                ck = val;
            }
        }

        if (countTX == 0 || gk == null || ck == null) return null;

        return Utils.round((sumTX + 2.0 * gk + 3.0 * ck) / (countTX + 5), 2);
    }

    /**
     * Đánh giá 1 môn có vi phạm điều kiện xếp loại hay không.
     */
    private String danhGiaMon(double diemMon, HocLucEnum hocLuc) {
        return switch (hocLuc) {
            case TOT -> diemMon < 6.5 ? "DƯỚI_6.5" : "DAT";
            case KHA -> diemMon < 5.0 ? "DƯỚI_5.0" : "DAT";
            case DAT -> diemMon < 3.5 ? "DƯỚI_3.5" : "DAT";
            default -> "DAT";
        };
    }

    /**
     * Lấy hạnh kiểm cả năm (ưu tiên HK2, nếu không có thì HK1).
     */
    private String layHanhKiemCaNam(Integer hocSinhId, Integer namHocId) {
        List<HanhKiem> list = hanhKiemRepository.findByHocSinhIdAndNamHocId(hocSinhId, namHocId);
        // Ưu tiên HK2
        Optional<HanhKiem> hk2 = list.stream()
                .filter(h -> h.getHocKy() != null && h.getHocKy() == 2)
                .findFirst();
        if (hk2.isPresent() && hk2.get().getXepLoai() != null) {
            return hk2.get().getXepLoai().name();
        }
        // Fallback HK1
        Optional<HanhKiem> hk1 = list.stream()
                .filter(h -> h.getHocKy() != null && h.getHocKy() == 1)
                .findFirst();
        if (hk1.isPresent() && hk1.get().getXepLoai() != null) {
            return hk1.get().getXepLoai().name();
        }
        return null;
    }
}
