package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.donxinnghi.DonXinNghiRequest;
import com.hethongtruongthpt.dto.donxinnghi.DonXinNghiResponse;
import com.hethongtruongthpt.dto.donxinnghi.DuyetNghiRequest;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.PhuHuynhRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.service.DonXinNghiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/don-xin-nghi")
public class DonXinNghiController {

    private final DonXinNghiService donXinNghiService;
    private final UserRepository userRepository;
    private final PhuHuynhRepository phuHuynhRepository;
    private final HocSinhRepository hocSinhRepository;
    private final GiaoVienRepository giaoVienRepository;

    public DonXinNghiController(DonXinNghiService donXinNghiService, UserRepository userRepository, PhuHuynhRepository phuHuynhRepository, HocSinhRepository hocSinhRepository, GiaoVienRepository giaoVienRepository) {
        this.donXinNghiService = donXinNghiService;
        this.userRepository = userRepository;
        this.phuHuynhRepository = phuHuynhRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.giaoVienRepository = giaoVienRepository;
    }

    @PreAuthorize("hasAnyRole('PHU_HUYNH', 'HOC_SINH')")
    @PostMapping
    public ResponseEntity<ApiResponse<DonXinNghiResponse>> createRequest(@Valid @RequestBody DonXinNghiRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        
        Integer phuHuynhId = null;
        Integer hocSinhId = null;
        
        if (user.getRole().name().equals("PHU_HUYNH")) {
            PhuHuynh ph = phuHuynhRepository.findByUserId(user.getId()).orElseThrow();
            phuHuynhId = ph.getId();
            // Lấy học sinh đầu tiên của phụ huynh này để đơn giản hóa. 
            // Nếu muốn chuẩn xác, cần truyền hocSinhId từ client.
            // Để hỗ trợ tốt nhất, client nên truyền hocSinhId. Nếu ko, tự lấy đứa đầu.
            hocSinhId = request.getHocSinhId(); // Wait, I need to add hocSinhId to request.
        } else if (user.getRole().name().equals("HOC_SINH")) {
            HocSinh hs = hocSinhRepository.findByUserId(user.getId()).orElseThrow();
            hocSinhId = hs.getId();
        }

        return ResponseEntity.ok(ApiResponse.ok(donXinNghiService.createRequest(phuHuynhId, hocSinhId, request)));
    }

    @PreAuthorize("hasAnyRole('PHU_HUYNH', 'HOC_SINH')")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<DonXinNghiResponse>>> getMyRequests() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        
        if (user.getRole().name().equals("PHU_HUYNH")) {
            PhuHuynh ph = phuHuynhRepository.findByUserId(user.getId()).orElseThrow();
            return ResponseEntity.ok(ApiResponse.ok(donXinNghiService.getByPhuHuynhId(ph.getId())));
        } else {
            HocSinh hs = hocSinhRepository.findByUserId(user.getId()).orElseThrow();
            return ResponseEntity.ok(ApiResponse.ok(donXinNghiService.getByHocSinhId(hs.getId())));
        }
    }

    @PreAuthorize("hasAnyRole('GIAO_VIEN')")
    @GetMapping("/lop/{lopId}")
    public ResponseEntity<ApiResponse<List<DonXinNghiResponse>>> getByLopId(@PathVariable Integer lopId) {
        // Có thể check xem GV này có phải GVCN không
        return ResponseEntity.ok(ApiResponse.ok(donXinNghiService.getByLopId(lopId)));
    }

    @PreAuthorize("hasAnyRole('GIAO_VIEN')")
    @PutMapping("/{id}/duyet")
    public ResponseEntity<ApiResponse<DonXinNghiResponse>> duyetDon(@PathVariable Integer id, @Valid @RequestBody DuyetNghiRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(ApiResponse.ok(donXinNghiService.duyetDon(id, request, username)));
    }

    @PreAuthorize("hasAnyRole('PHU_HUYNH', 'HOC_SINH')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteRequest(@PathVariable Integer id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        
        boolean isPhuHuynh = user.getRole().name().equals("PHU_HUYNH");
        Integer userId = isPhuHuynh ? phuHuynhRepository.findByUserId(user.getId()).orElseThrow().getId() 
                                    : hocSinhRepository.findByUserId(user.getId()).orElseThrow().getId();
                                    
        donXinNghiService.deleteRequest(id, userId, isPhuHuynh);
        return ResponseEntity.ok(ApiResponse.ok("Đã hủy đơn xin nghỉ", null));
    }
}
