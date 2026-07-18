package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.*;
import com.hethongtruongthpt.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class SmsService {
    private static final Logger log = LoggerFactory.getLogger(SmsService.class);
    private static final String ESMS_API_URL = "http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4/";
    private static final int MAX_SMS_PER_MONTH = 30;

    private final SmsLogRepository smsLogRepository;
    private final PhuHuynhHocSinhRepository phuHuynhHocSinhRepository;
    private final PhuHuynhRepository phuHuynhRepository;
    private final HocSinhRepository hocSinhRepository;
    private final AdminConfigService adminConfigService;
    private final RestTemplate restTemplate;

    public SmsService(SmsLogRepository smsLogRepository,
                      PhuHuynhHocSinhRepository phuHuynhHocSinhRepository,
                      PhuHuynhRepository phuHuynhRepository,
                      HocSinhRepository hocSinhRepository,
                      AdminConfigService adminConfigService,
                      RestTemplate restTemplate) {
        this.smsLogRepository = smsLogRepository;
        this.phuHuynhHocSinhRepository = phuHuynhHocSinhRepository;
        this.phuHuynhRepository = phuHuynhRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.adminConfigService = adminConfigService;
        this.restTemplate = restTemplate;
    }

    /**
     * Gui SMS thong bao vang mat cho phu huynh.
     */
    public void sendAbsenceNotifications(List<DiemDanh> absentRecords) {
        for (DiemDanh record : absentRecords) {
            try {
                sendAbsenceNotification(record);
            } catch (Exception e) {
                Integer hsId = record.getHocSinh() != null ? record.getHocSinh().getId() : null;
                log.warn("Không thể gửi SMS cho học sinh ID {}: {}", hsId, e.getMessage());
            }
        }
    }

    private void sendAbsenceNotification(DiemDanh record) {
        Integer hocSinhId = record.getHocSinh().getId();

        // Load full student + class from DB (avoid lazy proxy null issue)
        HocSinh hocSinh = hocSinhRepository.findById(hocSinhId).orElse(null);
        if (hocSinh == null) {
            log.warn("Không tìm thấy học sinh ID {}", hocSinhId);
            return;
        }

        String tenHocSinh = hocSinh.getHoTen();
        LopHoc lopHoc = hocSinh.getLop();
        String tenLop = lopHoc != null ? lopHoc.getTenLop() : "";

        if (tenLop.isEmpty() && record.getLopHoc() != null) {
            tenLop = record.getLopHoc().getTenLop() != null ? record.getLopHoc().getTenLop() : "";
        }

        List<PhuHuynhHocSinh> links = phuHuynhHocSinhRepository
            .findByHocSinhIdAndLaNguoiLienHeChinhTrue(hocSinhId);
        PhuHuynhHocSinh link = links.isEmpty() ? null : links.get(0);

        if (link == null || link.getPhuHuynh() == null) {
            log.debug("Không tìm thấy phụ huynh chính cho học sinh {}", hocSinhId);
            return;
        }

        PhuHuynh phuHuynh = link.getPhuHuynh();
        if (!Boolean.TRUE.equals(phuHuynh.getIsSmSActive())) {
            log.debug("Phụ huynh {} đã tắt SMS", phuHuynh.getHoTen());
            return;
        }

        String soDienThoai = phuHuynh.getSoDienThoai();
        if (soDienThoai == null || soDienThoai.isBlank()) {
            log.debug("Phụ huynh {} không có SĐT", phuHuynh.getHoTen());
            return;
        }

        String thangNam = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        long smsCount = smsLogRepository.countByHocSinhIdAndThangNam(hocSinhId, thangNam);
        if (smsCount >= MAX_SMS_PER_MONTH) {
            log.warn("Đã đạt giới hạn SMS tháng cho học sinh {}", hocSinhId);
            return;
        }

        String loaiVangLabel = "vắng mặt";
        if ("CO_PHEP".equals(record.getLoaiVang())) loaiVangLabel = "vắng có phép";
        else if ("KHONG_PHEP".equals(record.getLoaiVang())) loaiVangLabel = "vắng không phép";
        LocalDate ngay = record.getNgay();
        String tietInfo = record.getTietHoc() != null ? " tiết " + record.getTietHoc() : "";

        String noiDung = String.format(
            "Thông báo: Học sinh %s %s ngày %s lớp %s%s. Liên hệ trường để biết thêm chi tiết.",
            tenHocSinh, loaiVangLabel,
            ngay.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
            tenLop, tietInfo);

        sendSms(soDienThoai, noiDung, hocSinhId, phuHuynh.getId(), thangNam);
    }

    /**
     * Gui SMS qua ESMS API
     */
    public SmsResult sendSms(String phoneNumber, String message,
                              Integer hocSinhId, Integer phuHuynhId,
                              String thangNam) {
        SmsLog smsLog = new SmsLog();
        if (phuHuynhId != null) {
            phuHuynhRepository.findById(phuHuynhId).ifPresent(smsLog::setPhuHuynh);
        }
        hocSinhRepository.findById(hocSinhId).ifPresent(smsLog::setHocSinh);
        smsLog.setSoDienThoai(phoneNumber);
        smsLog.setNoiDung(message);
        smsLog.setTrangThai("PENDING");
        smsLog.setSoLanThu(0);
        smsLog.setThangNam(thangNam);
        smsLogRepository.save(smsLog);

        String apiKey = getConfigValue("sms_api_key", "");
        String secretKey = getConfigValue("sms_api_secret", "");
        String brandName = getConfigValue("sms_brand_name", "");

        if (apiKey.isBlank() || secretKey.isBlank()) {
            log.warn("Chưa cấu hình ESMS API Key/Secret. SMS chỉ ghi log.");
            smsLog.setTrangThai("NO_CONFIG");
            smsLogRepository.save(smsLog);
            return new SmsResult(false, "Chưa cấu hình ESMS API");
        }

        // Goi API ESMS (XML format)
        try {
            String xmlBody = String.format(
                "<SendMultipleMessage_V4Request>" +
                "<ApiKey>%s</ApiKey>" +
                "<SecretKey>%s</SecretKey>" +
                "<Content>%s</Content>" +
                "<Phone>%s</Phone>" +
                "<Brandname>%s</Brandname>" +
                "<SmsType>1</SmsType>" +
                "</SendMultipleMessage_V4Request>",
                escapeXml(apiKey), escapeXml(secretKey),
                escapeXml(message), escapeXml(phoneNumber),
                escapeXml(brandName));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            log.info("Gửi ESMS: Phone={}, Brandname={}", phoneNumber, brandName);

            HttpEntity<String> entity = new HttpEntity<>(xmlBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                ESMS_API_URL, HttpMethod.POST, entity, String.class);

            String body = response.getBody();
            log.info("ESMS response: {}", body);

            if (body != null && body.contains("\"CodeResult\"")) {
                String codeResult = extractJsonValue(body, "CodeResult");
                String errorMessage = extractJsonValue(body, "ErrorMessage");
                String smsId = extractJsonValue(body, "SMSID");

                if ("100".equals(codeResult)) {
                    smsLog.setTrangThai("SENT");
                    smsLog.setThoiGianGui(LocalDateTime.now());
                    smsLog.setMaGiaoDich(smsId);
                    smsLogRepository.save(smsLog);
                    log.info("SMS sent: {} -> {}", hocSinhId, phoneNumber);
                    return new SmsResult(true, "Gửi thành công");
                } else {
                    smsLog.setTrangThai("FAILED");
                    smsLog.setSoLanThu(smsLog.getSoLanThu() + 1);
                    smsLogRepository.save(smsLog);
                    log.warn("SMS failed: {} - CodeResult: {}, Error: {}", phoneNumber, codeResult, errorMessage);
                    return new SmsResult(false, errorMessage);
                }
            }

            smsLog.setTrangThai("FAILED");
            smsLog.setSoLanThu(smsLog.getSoLanThu() + 1);
            smsLogRepository.save(smsLog);
            return new SmsResult(false, "Phản hồi không hợp lệ từ ESMS");

        } catch (Exception e) {
            smsLog.setTrangThai("FAILED");
            smsLog.setSoLanThu(smsLog.getSoLanThu() + 1);
            smsLogRepository.save(smsLog);
            log.error("SMS API error: {}", e.getMessage());
            return new SmsResult(false, e.getMessage());
        }
    }

    public SmsResult sendSimpleSms(String phoneNumber, String message, Integer hocSinhId) {
        String thangNam = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        long count = smsLogRepository.countByHocSinhIdAndThangNam(hocSinhId, thangNam);
        if (count >= MAX_SMS_PER_MONTH) {
            return new SmsResult(false, "Đã đạt giới hạn 30 SMS/tháng");
        }
        return sendSms(phoneNumber, message, hocSinhId, null, thangNam);
    }

    /**
     * Test ket noi ESMS API
     */
    public Map<String, Object> testConnection() {
        String apiKey = getConfigValue("sms_api_key", "");
        String secretKey = getConfigValue("sms_api_secret", "");
        String brandName = getConfigValue("sms_brand_name", "");

        if (apiKey.isBlank() || secretKey.isBlank()) {
            return Map.of("success", false, "message", "Chưa cấu hình API Key hoặc Secret Key");
        }

        try {
            String xmlBody = String.format(
                "<SendMultipleMessage_V4Request>" +
                "<ApiKey>%s</ApiKey>" +
                "<SecretKey>%s</SecretKey>" +
                "<Content>Test connection</Content>" +
                "<Phone>0987654321</Phone>" +
                "<Brandname>%s</Brandname>" +
                "<SmsType>2</SmsType>" +
                "<Sandbox>1</Sandbox>" +
                "</SendMultipleMessage_V4Request>",
                escapeXml(apiKey), escapeXml(secretKey), escapeXml(brandName));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            log.info("Test ESMS connection: ApiKey={}, Brandname={}", apiKey, brandName);

            HttpEntity<String> entity = new HttpEntity<>(xmlBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                ESMS_API_URL, HttpMethod.POST, entity, String.class);

            String body = response.getBody();
            log.info("ESMS test response: {}", body);

            if (body != null && body.contains("\"CodeResult\"")) {
                String codeResult = extractJsonValue(body, "CodeResult");
                String errorMessage = extractJsonValue(body, "ErrorMessage");

                if ("100".equals(codeResult)) {
                    return Map.of("success", true, "message", "Kết nối thành công! API Key hợp lệ.");
                } else if ("101".equals(codeResult)) {
                    return Map.of("success", false, "message", "API Key hoặc Secret Key không đúng.");
                } else {
                    return Map.of("success", false, "message",
                        "Lỗi ESMS: " + (errorMessage != null ? errorMessage : "Không xác định"));
                }
            }

            return Map.of("success", false, "message", "Phản hồi không hợp lệ từ ESMS");
        } catch (Exception e) {
            log.error("Test ESMS error: {}", e.getMessage());
            return Map.of("success", false, "message", "Lỗi kết nối: " + e.getMessage());
        }
    }

    private static String extractJsonValue(String json, String key) {
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);
        if (start < 0) return null;
        start += pattern.length();
        int end = json.indexOf("\"", start);
        if (end < 0) return null;
        return json.substring(start, end);
    }

    private String getConfigValue(String key, String defaultValue) {
        try {
            return adminConfigService.getByKey(key).getConfigValue();
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private static String escapeXml(String text) {
        if (text == null) return "";
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;");
    }

    public static class SmsResult {
        private final boolean success;
        private final String message;

        public SmsResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
}
