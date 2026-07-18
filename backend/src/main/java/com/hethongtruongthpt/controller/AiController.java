package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.ai.AiClassAnalysisResponse;
import com.hethongtruongthpt.dto.ai.AiSuggestionResponse;
import com.hethongtruongthpt.service.AiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final Logger log = LoggerFactory.getLogger(AiController.class);
    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
    @GetMapping("/goi-y/hoc-sinh/{hocSinhId}")
    public ResponseEntity<ApiResponse<AiSuggestionResponse>> goiYHocTap(
            @PathVariable Integer hocSinhId,
            @RequestParam Integer hocKy,
            @RequestParam String namHoc) {
        log.info("Yêu cầu gợi ý AI cho học sinh: hocSinhId={}, hocKy={}, namHoc={}", hocSinhId, hocKy, namHoc);
        AiSuggestionResponse result = aiService.goiYHocTap(hocSinhId, hocKy, namHoc);
        return ResponseEntity.ok(ApiResponse.ok("Gợi ý học tập từ AI", result));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/phan-tich/lop/{lopId}")
    public ResponseEntity<ApiResponse<AiClassAnalysisResponse>> phanTichLop(
            @PathVariable Integer lopId,
            @RequestParam Integer hocKy,
            @RequestParam String namHoc) {
        log.info("Yêu cầu phân tích AI cho lớp: lopId={}, hocKy={}, namHoc={}", lopId, hocKy, namHoc);
        AiClassAnalysisResponse result = aiService.phanTichLop(lopId, hocKy, namHoc);
        return ResponseEntity.ok(ApiResponse.ok("Phân tích lớp học từ AI", result));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> status() {
        boolean configured = aiService.isAiConfigured();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("configured", configured)));
    }
}
