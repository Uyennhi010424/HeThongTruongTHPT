package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.entity.PhuHuynhHocSinh;
import com.hethongtruongthpt.repository.PhuHuynhHocSinhRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.PhuHuynhRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/phuhuynh-hocsinh")
public class PhuHuynhHocSinhController {
    private final PhuHuynhHocSinhRepository repository;
    private final PhuHuynhRepository phuHuynhRepository;
    private final HocSinhRepository hocSinhRepository;

    public PhuHuynhHocSinhController(PhuHuynhHocSinhRepository repository,
                                    PhuHuynhRepository phuHuynhRepository,
                                    HocSinhRepository hocSinhRepository) {
        this.repository = repository;
        this.phuHuynhRepository = phuHuynhRepository;
        this.hocSinhRepository = hocSinhRepository;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping("/{id}/phuhuynh")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getParentsForStudent(@PathVariable("id") Integer id) {
        List<PhuHuynhHocSinh> links = repository.findByHocSinhId(id);
        List<Map<String, Object>> parents = links.stream()
            .map(link -> {
                try {
                    PhuHuynh ph = link.getPhuHuynh();
                    if (ph == null) return null;
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", ph.getId() != null ? ph.getId() : 0);
                    map.put("userId", (ph.getUser() != null && ph.getUser().getId() != null) ? ph.getUser().getId() : null);
                    map.put("hoTen", ph.getHoTen() != null ? ph.getHoTen() : "");
                    map.put("soDienThoai", ph.getSoDienThoai() != null ? ph.getSoDienThoai() : "");
                    map.put("email", ph.getEmail() != null ? ph.getEmail() : "");
                    map.put("ngheNghiep", ph.getNgheNghiep() != null ? ph.getNgheNghiep() : "");
                    map.put("quanHe", link.getQuanHe() != null ? link.getQuanHe() : (ph.getQuanHe() != null ? ph.getQuanHe() : "CHA"));
                    map.put("laNguoiLienHeChinh", link.getLaNguoiLienHeChinh());
                    return map;
                } catch (Exception e) {
                    return null;
                }
            })
            .filter(p -> p != null)
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(parents));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/phuhuynh/{phId}")
    public ResponseEntity<ApiResponse<Object>> linkParentToStudent(@PathVariable("id") Integer id, @PathVariable("phId") Integer phId) {
        try {
            List<PhuHuynhHocSinh> existingLinks = repository.findByHocSinhId(id);
            boolean alreadyLinked = existingLinks.stream()
                .anyMatch(l -> l.getPhuHuynh() != null && phId.equals(l.getPhuHuynh().getId()));
            if (alreadyLinked) {
                return ResponseEntity.ok(ApiResponse.ok("Đã liên kết trước đó", null));
            }

            PhuHuynh ph = phuHuynhRepository.findById(phId).orElse(null);
            if (ph == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Phụ huynh không tồn tại"));
            }
            HocSinh hs = hocSinhRepository.findById(id).orElse(null);
            if (hs == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Học sinh không tồn tại"));
            }

            PhuHuynhHocSinh link = new PhuHuynhHocSinh();
            link.setPhuHuynh(ph);
            link.setHocSinh(hs);
            link.setQuanHe(ph.getQuanHe() != null && !ph.getQuanHe().isBlank() ? ph.getQuanHe() : "CHA");
            link.setLaNguoiLienHeChinh(existingLinks.isEmpty());
            repository.save(link);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Linked", null));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("Không thể tạo liên kết: " + ex.getMessage()));
        }
    }
}
