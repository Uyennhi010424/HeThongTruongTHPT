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

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/phuhuynh-hocsinh")
public class PhuHuynhHocSinhController {
    private final PhuHuynhHocSinhRepository repository;

    public PhuHuynhHocSinhController(PhuHuynhHocSinhRepository repository) {
        this.repository = repository;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH')")
    @GetMapping("/{id}/phuhuynh")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getParentsForStudent(@PathVariable("id") Integer id) {
        List<PhuHuynhHocSinh> links = repository.findByHocSinhId(id);
        List<Map<String, Object>> parents = links.stream()
            .map(link -> {
                try {
                    PhuHuynh ph = link.getPhuHuynh();
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", ph.getId() != null ? ph.getId() : 0);
                    map.put("userId", (ph.getUser() != null && ph.getUser().getId() != null) ? ph.getUser().getId() : null);
                    map.put("hoTen", ph.getHoTen() != null ? ph.getHoTen() : "");
                    map.put("soDienThoai", ph.getSoDienThoai() != null ? ph.getSoDienThoai() : "");
                    map.put("email", ph.getEmail() != null ? ph.getEmail() : "");
                    map.put("ngheNghiep", ph.getNgheNghiep() != null ? ph.getNgheNghiep() : "");
                    map.put("quanHe", link.getQuanHe() != null ? link.getQuanHe() : "");
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
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ApiResponse<Object>> linkParentToStudent(@PathVariable("id") Integer id, @PathVariable("phId") Integer phId) {
        // create mapping if not exists
        try {
            PhuHuynhHocSinh link = new PhuHuynhHocSinh();
            PhuHuynh ph = new PhuHuynh();
            ph.setId(phId);
            link.setPhuHuynh(ph);
            com.hethongtruongthpt.entity.HocSinh hs = new com.hethongtruongthpt.entity.HocSinh();
            hs.setId(id);
            link.setHocSinh(hs);
            // required non-null fields on PhuHuynhHocSinh: set sensible defaults
            link.setQuanHe("CHA");
            link.setLaNguoiLienHeChinh(Boolean.TRUE);
            repository.save(link);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Linked", null));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Không thể tạo liên kết"));
        }
    }
}
