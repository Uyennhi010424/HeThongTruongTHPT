package com.hethongtruongthpt.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hethongtruongthpt.dto.ai.AiClassAnalysisResponse;
import com.hethongtruongthpt.dto.ai.AiSuggestionResponse;
import com.hethongtruongthpt.entity.*;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    private static final long CACHE_HOURS = 168L; // 7 days

    private final HocSinhRepository hocSinhRepository;
    private final DiemRepository diemRepository;
    private final DiemDanhRepository diemDanhRepository;
    private final HanhKiemRepository hanhKiemRepository;
    private final LopHocRepository lopHocRepository;
    private final NamHocRepository namHocRepository;
    private final AiSuggestionRepository aiSuggestionRepository;
    private final AdminConfigService adminConfigService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AiService(HocSinhRepository hocSinhRepository,
                     DiemRepository diemRepository,
                     DiemDanhRepository diemDanhRepository,
                     HanhKiemRepository hanhKiemRepository,
                     LopHocRepository lopHocRepository,
                     NamHocRepository namHocRepository,
                     AiSuggestionRepository aiSuggestionRepository,
                     AdminConfigService adminConfigService,
                     RestTemplate restTemplate,
                     ObjectMapper objectMapper) {
        this.hocSinhRepository = hocSinhRepository;
        this.diemRepository = diemRepository;
        this.diemDanhRepository = diemDanhRepository;
        this.hanhKiemRepository = hanhKiemRepository;
        this.lopHocRepository = lopHocRepository;
        this.namHocRepository = namHocRepository;
        this.aiSuggestionRepository = aiSuggestionRepository;
        this.adminConfigService = adminConfigService;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Gợi ý học tập cho một học sinh dựa trên điểm, hạnh kiểm, chuyên cần.
     */
    public AiSuggestionResponse goiYHocTap(Integer hocSinhId, Integer hocKy, String namHoc) {
        // 1. Check cache
        Optional<AiSuggestion> cached = aiSuggestionRepository
                .findByHocSinhIdAndHocKyAndNamHocAndHetHanAfter(hocSinhId, hocKy, namHoc, LocalDateTime.now());
        if (cached.isPresent()) {
            try {
                return objectMapper.readValue(cached.get().getNoiDungJson(), AiSuggestionResponse.class);
            } catch (JsonProcessingException e) {
                log.warn("Không thể đọc cache AI, sẽ gọi lại API: {}", e.getMessage());
            }
        }

        // 2. Fetch student
        HocSinh hocSinh = hocSinhRepository.findById(hocSinhId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh: " + hocSinhId));

        // 3. Fetch NamHoc entity for semester date ranges
        NamHoc namHocEntity = namHocRepository.findByTenNamHoc(namHoc)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy năm học: " + namHoc));

        LocalDate fromDate;
        LocalDate toDate;
        if (hocKy == 1) {
            fromDate = namHocEntity.getNgayBatDauHk1();
            toDate = namHocEntity.getNgayKetThucHk1();
        } else {
            fromDate = namHocEntity.getNgayBatDauHk2();
            toDate = namHocEntity.getNgayKetThucHk2();
        }

        // 4. Fetch academic data
        List<Diem> allDiem = diemRepository.findByHocSinhIdAndNamHoc(hocSinhId, namHoc);
        List<Diem> diemHocKy = allDiem.stream()
                .filter(d -> d.getHocKy().equals(hocKy))
                .collect(Collectors.toList());

        // 5. Fetch attendance data
        List<DiemDanh> diemDanhList = diemDanhRepository.findByHocSinhIdAndNgayBetween(hocSinhId, fromDate, toDate);

        // 6. Fetch conduct data
        List<HanhKiem> hanhKiemList = hanhKiemRepository.findByHocSinhId(hocSinhId);

        // 7. Build prompt
        String prompt = buildStudentPrompt(hocSinh, diemHocKy, diemDanhList, hanhKiemList, hocKy, namHoc);

        // 8. Call AI
        String aiResponseText = callGeminiApi(prompt);

        // 9. Parse response
        AiSuggestionResponse result;
        try {
            // Try to extract JSON from response (AI may include extra text)
            String jsonText = extractJsonFromText(aiResponseText);
            result = objectMapper.readValue(jsonText, AiSuggestionResponse.class);
        } catch (JsonProcessingException e) {
            log.error("Không thể phân tích phản hồi AI: {}. Raw text: {}", e.getMessage(), aiResponseText.substring(0, Math.min(500, aiResponseText.length())));
            throw new ApiException("Không thể phân tích kết quả từ AI. Vui lòng thử lại.");
        }

        // 10. Cache result
        try {
            AiSuggestion suggestion = new AiSuggestion();
            suggestion.setHocSinhId(hocSinhId);
            suggestion.setNoiDungJson(objectMapper.writeValueAsString(result));
            suggestion.setHocKy(hocKy);
            suggestion.setNamHoc(namHoc);
            suggestion.setNgayTao(LocalDateTime.now());
            suggestion.setHetHan(LocalDateTime.now().plusHours(CACHE_HOURS));
            suggestion.setMoHinhAi(getConfigValue("ai_model", "gemini-2.0-flash"));
            aiSuggestionRepository.save(suggestion);
        } catch (Exception e) {
            log.warn("Không thể lưu cache AI: {}", e.getMessage());
        }

        return result;
    }

    /**
     * Phân tích toàn bộ lớp học: tổng quan, học sinh cần chú ý, gợi ý cho giáo viên.
     */
    public AiClassAnalysisResponse phanTichLop(Integer lopId, Integer hocKy, String namHoc) {
        // 1. Validate class exists
        LopHoc lopHoc = lopHocRepository.findById(lopId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp: " + lopId));

        // 2. Fetch NamHoc entity
        NamHoc namHocEntity = namHocRepository.findByTenNamHoc(namHoc)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy năm học: " + namHoc));

        LocalDate fromDate;
        LocalDate toDate;
        if (hocKy == 1) {
            fromDate = namHocEntity.getNgayBatDauHk1();
            toDate = namHocEntity.getNgayKetThucHk1();
        } else {
            fromDate = namHocEntity.getNgayBatDauHk2();
            toDate = namHocEntity.getNgayKetThucHk2();
        }

        // 3. Fetch all students in the class
        List<HocSinh> hocSinhList = hocSinhRepository.findByLopId(lopId);
        if (hocSinhList.isEmpty()) {
            throw new ApiException("Lớp không có học sinh nào.");
        }

        // 4. Build prompt with data for all students
        String prompt = buildClassPrompt(lopHoc, hocSinhList, hocKy, namHoc, fromDate, toDate);

        // 5. Call AI
        String aiResponseText = callGeminiApi(prompt);

        // 6. Parse response
        AiClassAnalysisResponse result;
        try {
            String jsonText = extractJsonFromText(aiResponseText);
            result = objectMapper.readValue(jsonText, AiClassAnalysisResponse.class);
        } catch (JsonProcessingException e) {
            log.error("Không thể phân tích phản hồi AI cho lớp: {}", e.getMessage());
            throw new ApiException("Không thể phân tích kết quả từ AI. Vui lòng thử lại.");
        }

        return result;
    }

    /**
     * Kiểm tra AI đã được cấu hình hay chưa.
     */
    public boolean isAiConfigured() {
        try {
            String apiKey = getConfigValue("ai_api_key", "");
            return !apiKey.isBlank();
        } catch (Exception e) {
            return false;
        }
    }

    // ========== PRIVATE HELPERS ==========

    private String getConfigValue(String key, String defaultValue) {
        try {
            AdminConfig config = adminConfigService.getByKey(key);
            String value = config.getConfigValue();
            return (value != null && !value.isBlank()) ? value : defaultValue;
        } catch (ResourceNotFoundException e) {
            return defaultValue;
        }
    }

    /**
     * Gọi Gemini API với prompt cho trước.
     */
    private String callGeminiApi(String prompt) {
        String apiKey = getConfigValue("ai_api_key", "");
        if (apiKey.isBlank()) {
            throw new ApiException("Chưa cấu hình Gemini API Key. Vui lòng liên hệ quản trị viên.");
        }

        String model = getConfigValue("ai_model", "gemini-2.0-flash");
        String baseUrl = getConfigValue("gemini_api_url",
                "https://generativelanguage.googleapis.com/v1beta/models");
        String url = baseUrl + "/" + model + ":generateContent?key=" + apiKey;

        // Build request body
        Map<String, Object> requestBody = new LinkedHashMap<>();
        Map<String, Object> content = new LinkedHashMap<>();
        Map<String, Object> part = new LinkedHashMap<>();
        part.put("text", prompt);
        content.put("parts", Collections.singletonList(part));
        requestBody.put("contents", Collections.singletonList(content));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 16384);
        requestBody.put("generationConfig", generationConfig);

        // Set headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("Đang gọi Gemini API với model: {}", model);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity, new org.springframework.core.ParameterizedTypeReference<>() {});

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return extractTextFromResponse(response.getBody());
            } else {
                log.error("Gemini API trả về lỗi: {}", response.getStatusCode());
                throw new ApiException("AI không thể xử lý yêu cầu. Mã lỗi: " + response.getStatusCode());
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini API: {}", e.getMessage());
            throw new ApiException("Không thể kết nối đến AI. Vui lòng thử lại sau.");
        }
    }

    /**
     * Trích xuất text từ phản hồi JSON của Gemini API.
     */
    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> responseBody) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new ApiException("AI không trả về kết quả.");
            }

            Map<String, Object> firstCandidate = candidates.get(0);
            Map<String, Object> contentMap = (Map<String, Object>) firstCandidate.get("content");

            if (contentMap == null) {
                // Check for safety block
                Map<String, Object> safetyRatings = (Map<String, Object>) firstCandidate.get("safetyRatings");
                if (safetyRatings != null) {
                    throw new ApiException("Nội dung bị chặn bởi bộ lọc an toàn của AI.");
                }
                throw new ApiException("AI không trả về nội dung hợp lệ.");
            }

            List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
            if (parts == null || parts.isEmpty()) {
                throw new ApiException("AI không trả về nội dung.");
            }

            StringBuilder textBuilder = new StringBuilder();
            for (Map<String, Object> partMap : parts) {
                String text = (String) partMap.get("text");
                if (text != null) {
                    textBuilder.append(text);
                }
            }

            String rawText = textBuilder.toString().trim();

            // Strip markdown code block wrappers if present
            rawText = stripMarkdownCodeBlock(rawText);

            return rawText;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi khi phân tích phản hồi Gemini: {}", e.getMessage());
            throw new ApiException("Không thể đọc kết quả từ AI.");
        }
    }

    /**
     * Loại bỏ markdown code block wrapper (```json ... ```) nếu có.
     */
    private String stripMarkdownCodeBlock(String text) {
        if (text.startsWith("```")) {
            // Remove opening ```json or ```
            int firstNewline = text.indexOf('\n');
            if (firstNewline > 0) {
                text = text.substring(firstNewline + 1);
            }
            // Remove closing ```
            if (text.endsWith("```")) {
                text = text.substring(0, text.length() - 3);
            }
            text = text.trim();
        }
        return text;
    }

    /**
     * Trích xuất JSON từ text (AI có thể trả về text thêm trước/sau JSON).
     */
    private String extractJsonFromText(String text) {
        text = stripMarkdownCodeBlock(text);
        // Find first { and last }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    /**
     * Xây dựng prompt phân tích học sinh.
     */
    private String buildStudentPrompt(HocSinh hocSinh,
                                       List<Diem> diemList,
                                       List<DiemDanh> diemDanhList,
                                       List<HanhKiem> hanhKiemList,
                                       Integer hocKy,
                                       String namHoc) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là chuyên gia giáo dục. Hãy phân tích dữ liệu học tập của học sinh sau ");
        sb.append("và đưa ra gợi ý cải thiện bằng tiếng Việt.\n\n");

        // Student info
        sb.append("THÔNG TIN HỌC SINH:\n");
        sb.append("- Họ tên: ").append(hocSinh.getHoTen()).append("\n");
        if (hocSinh.getLop() != null) {
            sb.append("- Lớp: ").append(hocSinh.getLop().getTenLop()).append("\n");
        }
        sb.append("- Học kỳ: ").append(hocKy).append("\n");
        sb.append("- Năm học: ").append(namHoc).append("\n\n");

        // Scores
        sb.append("ĐIỂM SỐ:\n");
        if (diemList.isEmpty()) {
            sb.append("Chưa có điểm.\n");
        } else {
            Map<String, List<Diem>> diemByMon = diemList.stream()
                    .collect(Collectors.groupingBy(d -> d.getMonHoc().getTenMon()));
            for (Map.Entry<String, List<Diem>> entry : diemByMon.entrySet()) {
                sb.append("Môn ").append(entry.getKey()).append(": ");
                for (Diem d : entry.getValue()) {
                    sb.append(d.getLoaiDiem());
                    if (d.getSoThuTu() > 0) {
                        sb.append(d.getSoThuTu());
                    }
                    sb.append("=").append(d.getGiaTriDiem()).append("; ");
                }
                sb.append("\n");
            }
        }
        sb.append("\n");

        // Attendance
        sb.append("CHUYÊN CẦN:\n");
        long coPhep = diemDanhList.stream()
                .filter(d -> "CO_PHEP".equals(d.getLoaiVang())).count();
        long khongPhep = diemDanhList.stream()
                .filter(d -> "KHONG_PHEP".equals(d.getLoaiVang())).count();
        sb.append("- Nghỉ có phép: ").append(coPhep).append(" buổi\n");
        sb.append("- Nghỉ không phép: ").append(khongPhep).append(" buổi\n\n");

        // Conduct
        sb.append("HẠNH KIỂM:\n");
        if (hanhKiemList.isEmpty()) {
            sb.append("Chưa có đánh giá hạnh kiểm.\n");
        } else {
            for (HanhKiem hk : hanhKiemList) {
                sb.append("- Xếp loại: ").append(hk.getXepLoai());
                if (hk.getNhanXet() != null && !hk.getNhanXet().isBlank()) {
                    sb.append(". Nhận xét: ").append(hk.getNhanXet());
                }
                sb.append("\n");
            }
        }
        sb.append("\n");

        // Response format
        sb.append("Hãy trả về JSON đúng định dạng sau (không thêm text khác ngoài JSON):\n");
        sb.append("{\n");
        sb.append("  \"diemManh\": [\"điểm mạnh 1\", \"điểm mạnh 2\"],\n");
        sb.append("  \"diemYeu\": [\"điểm yếu 1\", \"điểm yếu 2\"],\n");
        sb.append("  \"goiYMonHoc\": [{\"mon\": \"Tên môn\", \"goiY\": \"Gợi ý cụ thể\"}],\n");
        sb.append("  \"goiYChung\": [\"gợi ý chung 1\", \"gợi ý chung 2\"],\n");
        sb.append("  \"mucDoHocLuc\": \"Giỏi/Khá/Trung bình/Yếu\",\n");
        sb.append("  \"hanhDongCanLam\": [\"hành động 1\", \"hành động 2\"]\n");
        sb.append("}");

        return sb.toString();
    }

    /**
     * Xây dựng prompt phân tích lớp học.
     */
    private String buildClassPrompt(LopHoc lopHoc,
                                     List<HocSinh> hocSinhList,
                                     Integer hocKy,
                                     String namHoc,
                                     LocalDate fromDate,
                                     LocalDate toDate) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là chuyên gia giáo dục. Hãy phân tích dữ liệu của lớp học sau ");
        sb.append("và đưa ra nhận định, gợi ý cho giáo viên bằng tiếng Việt.\n\n");

        // Class info
        sb.append("THÔNG TIN LỚP:\n");
        sb.append("- Tên lớp: ").append(lopHoc.getTenLop()).append("\n");
        sb.append("- Sĩ số: ").append(hocSinhList.size()).append(" học sinh\n");
        if (lopHoc.getGvcn() != null) {
            sb.append("- Giáo viên chủ nhiệm: ").append(lopHoc.getGvcn().getHoTen()).append("\n");
        }
        sb.append("- Học kỳ: ").append(hocKy).append("\n");
        sb.append("- Năm học: ").append(namHoc).append("\n\n");

        // Student data - summarized to reduce prompt length
        sb.append("DỮ LIỆU HỌC SINH:\n");
        for (HocSinh hs : hocSinhList) {
            // Calculate semester average
            List<Diem> diemList = diemRepository.findByHocSinhIdAndNamHoc(hs.getId(), namHoc);
            List<Diem> diemHocKy = diemList.stream()
                    .filter(d -> d.getHocKy().equals(hocKy))
                    .collect(Collectors.toList());

            Double avg = null;
            if (!diemHocKy.isEmpty()) {
                double sumTx = 0; int cntTx = 0; Double gk = null, ck = null;
                for (Diem d : diemHocKy) {
                    if (d.getGiaTriDiem() == null) continue;
                    double v = d.getGiaTriDiem().doubleValue();
                    if ("TX".equals(d.getLoaiDiem())) { sumTx += v; cntTx++; }
                    else if ("GK".equals(d.getLoaiDiem())) gk = v;
                    else if ("CK".equals(d.getLoaiDiem())) ck = v;
                }
                if (cntTx > 0 && gk != null && ck != null) {
                    avg = Math.round((sumTx + 2*gk + 3*ck) / (cntTx + 5) * 100.0) / 100.0;
                }
            }

            // Attendance summary
            List<DiemDanh> ddList = diemDanhRepository.findByHocSinhIdAndNgayBetween(hs.getId(), fromDate, toDate);
            long cp = ddList.stream().filter(d -> "CO_PHEP".equals(d.getLoaiVang())).count();
            long kp = ddList.stream().filter(d -> "KHONG_PHEP".equals(d.getLoaiVang())).count();

            // Conduct
            List<HanhKiem> hkList = hanhKiemRepository.findByHocSinhId(hs.getId());
            String xepLoai = hkList.stream()
                    .filter(hk -> hk.getNamHoc() != null && namHoc.equals(hk.getNamHoc().getTenNamHoc()) && hk.getHocKy().equals(hocKy))
                    .map(hk -> hk.getXepLoai().name()).findFirst().orElse("--");

            sb.append("- ").append(hs.getHoTen())
              .append(": DTB=").append(avg != null ? avg : "N/A")
              .append(", nghỉ_cp=").append(cp).append(", nghỉ_kp=").append(kp)
              .append(", hạnh_kiểm=").append(xepLoai).append("\n");
        }

        // Response format
        sb.append("Hãy trả về JSON đúng định dạng sau (không thêm text khác ngoài JSON):\n");
        sb.append("{\n");
        sb.append("  \"tongQuanLop\": \"Nhận định tổng quan về lớp\",\n");
        sb.append("  \"diemManhLop\": [\"điểm mạnh 1\", \"điểm mạnh 2\"],\n");
        sb.append("  \"diemYeuLop\": [\"điểm yếu 1\", \"điểm yếu 2\"],\n");
        sb.append("  \"hocSinhCanChuY\": [{\"hocSinhId\": 1, \"hoTen\": \"Tên HS\", \"lyDo\": \"Lý do\", \"goiY\": \"Gợi ý\"}],\n");
        sb.append("  \"goiYGiaoVien\": [\"gợi ý 1\", \"gợi ý 2\"],\n");
        sb.append("  \"phuongPhapDay\": [\"phương pháp 1\", \"phương pháp 2\"]\n");
        sb.append("}");

        return sb.toString();
    }
}
