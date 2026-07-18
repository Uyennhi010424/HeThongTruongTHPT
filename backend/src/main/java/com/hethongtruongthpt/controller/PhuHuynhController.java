package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.service.PhuHuynhService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/phuhuynh")
public class PhuHuynhController {
    private static final Logger log = LoggerFactory.getLogger(PhuHuynhController.class);
    private final PhuHuynhService phuHuynhService;

    public PhuHuynhController(PhuHuynhService phuHuynhService) {
        this.phuHuynhService = phuHuynhService;
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PhuHuynh>> getCurrentParent() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.ok(ApiResponse.ok(null));
            }
            PhuHuynh phuHuynh = phuHuynhService.getByUsername(username);
            return ResponseEntity.ok(ApiResponse.ok(phuHuynh));
        } catch (Exception ex) {
            log.warn("Không thể lấy thông tin phụ huynh hiện tại: {}", ex.getMessage());
            return ResponseEntity.ok(ApiResponse.ok(null));
        }
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}/hocsinh")
    public ResponseEntity<ApiResponse<List<HocSinh>>> getStudentsByParent(@PathVariable Integer id) {
        // IDOR protection: chỉ phụ huynh xem được con mình, hoặc ADMIN xem được tất cả
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            try {
                PhuHuynh currentUser = phuHuynhService.getByUsername(username);
                if (currentUser == null || !currentUser.getId().equals(id)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(ApiResponse.error("Bạn chỉ có thể xem thông tin con em mình"));
                }
            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Không thể xác thực quyền truy cập"));
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(phuHuynhService.getStudentsByPhuHuynhId(id)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            Page<PhuHuynh> result = phuHuynhService.getAllPaged(page, size);
            return ResponseEntity.ok(ApiResponse.ok(result));
        }
        return ResponseEntity.ok(ApiResponse.ok(phuHuynhService.getAll()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PhuHuynh>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(phuHuynhService.getById(id)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<PhuHuynh>> create(@Valid @RequestBody PhuHuynh phuHuynh) {
        return ResponseEntity.ok(ApiResponse.ok(phuHuynhService.create(phuHuynh)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PhuHuynh>> update(@PathVariable Integer id, @Valid @RequestBody PhuHuynh phuHuynh) {
        return ResponseEntity.ok(ApiResponse.ok(phuHuynhService.update(id, phuHuynh)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
        phuHuynhService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
    }
}
