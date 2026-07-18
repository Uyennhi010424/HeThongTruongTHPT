package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.khenthuong.KhenThuongRequest;
import com.hethongtruongthpt.dto.vipham.ViPhamRequest;
import com.hethongtruongthpt.entity.KhenThuong;
import com.hethongtruongthpt.entity.ViPham;
import com.hethongtruongthpt.repository.KhenThuongRepository;
import com.hethongtruongthpt.repository.ViPhamRepository;
import com.hethongtruongthpt.service.KhenThuongViPhamService;
import com.hethongtruongthpt.service.KhenThuongViPhamService.ImportResult;
import jakarta.validation.Valid;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.List;

@RestController
@RequestMapping("/api/khen-thuong-vi-pham")
public class KhenThuongViPhamController {

    private static final Logger log = LoggerFactory.getLogger(KhenThuongViPhamController.class);

    private final KhenThuongRepository khenThuongRepository;
    private final ViPhamRepository viPhamRepository;
    private final KhenThuongViPhamService khenThuongViPhamService;

    public KhenThuongViPhamController(KhenThuongRepository khenThuongRepository,
                                      ViPhamRepository viPhamRepository,
                                      KhenThuongViPhamService khenThuongViPhamService) {
        this.khenThuongRepository = khenThuongRepository;
        this.viPhamRepository = viPhamRepository;
        this.khenThuongViPhamService = khenThuongViPhamService;
    }

    // ==================== GET endpoints (existing) ====================

    @GetMapping("/khen-thuong")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
    public ResponseEntity<ApiResponse<List<KhenThuong>>> getKhenThuong(
            @RequestParam(required = false) Integer hocSinhId) {
        if (hocSinhId != null) {
            return ResponseEntity.ok(ApiResponse.ok(khenThuongRepository.findByHocSinhId(hocSinhId)));
        }
        return ResponseEntity.ok(ApiResponse.ok(khenThuongRepository.findAll()));
    }

    @GetMapping("/vi-pham")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
    public ResponseEntity<ApiResponse<List<ViPham>>> getViPham(
            @RequestParam(required = false) Integer hocSinhId) {
        if (hocSinhId != null) {
            return ResponseEntity.ok(ApiResponse.ok(viPhamRepository.findByHocSinhId(hocSinhId)));
        }
        return ResponseEntity.ok(ApiResponse.ok(viPhamRepository.findAll()));
    }

    // ==================== Khen Thuong CRUD ====================

    @PostMapping("/khen-thuong")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<KhenThuong>> createKhenThuong(
            @Valid @RequestBody KhenThuongRequest request) {
        KhenThuong khenThuong = khenThuongViPhamService.createKhenThuong(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo khen thưởng thành công", khenThuong));
    }

    @PutMapping("/khen-thuong/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<KhenThuong>> updateKhenThuong(
            @PathVariable Integer id,
            @Valid @RequestBody KhenThuongRequest request) {
        KhenThuong khenThuong = khenThuongViPhamService.updateKhenThuong(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật khen thưởng thành công", khenThuong));
    }

    @DeleteMapping("/khen-thuong/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<Void>> deleteKhenThuong(@PathVariable Integer id) {
        khenThuongViPhamService.deleteKhenThuong(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa khen thưởng thành công", null));
    }

    // ==================== Vi Pham CRUD ====================

    @PostMapping("/vi-pham")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<ViPham>> createViPham(
            @Valid @RequestBody ViPhamRequest request) {
        ViPham viPham = khenThuongViPhamService.createViPham(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo vi phạm thành công", viPham));
    }

    @PutMapping("/vi-pham/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<ViPham>> updateViPham(
            @PathVariable Integer id,
            @Valid @RequestBody ViPhamRequest request) {
        ViPham viPham = khenThuongViPhamService.updateViPham(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật vi phạm thành công", viPham));
    }

    @DeleteMapping("/vi-pham/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<Void>> deleteViPham(@PathVariable Integer id) {
        khenThuongViPhamService.deleteViPham(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa vi phạm thành công", null));
    }

    // ==================== Import Excel ====================

    @PostMapping("/khen-thuong/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<ImportResult>> importKhenThuong(
            @RequestParam("file") MultipartFile file) {
        if (!isValidExcelFile(file)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Chỉ chấp nhận file Excel (.xlsx, .xls)"));
        }
        try {
            ImportResult result = khenThuongViPhamService.importKhenThuongFromExcel(file.getInputStream());
            String msg = "Import hoàn tất: " + result.getSuccessCount() + " thành công, "
                    + result.getFailedCount() + " thất bại";
            return ResponseEntity.ok(ApiResponse.ok(msg, result));
        } catch (Exception e) {
            log.error("Lỗi import khen thưởng", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi import: " + e.getMessage()));
        }
    }

    @PostMapping("/vi-pham/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<ImportResult>> importViPham(
            @RequestParam("file") MultipartFile file) {
        if (!isValidExcelFile(file)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Chỉ chấp nhận file Excel (.xlsx, .xls)"));
        }
        try {
            ImportResult result = khenThuongViPhamService.importViPhamFromExcel(file.getInputStream());
            String msg = "Import hoàn tất: " + result.getSuccessCount() + " thành công, "
                    + result.getFailedCount() + " thất bại";
            return ResponseEntity.ok(ApiResponse.ok(msg, result));
        } catch (Exception e) {
            log.error("Lỗi import vi phạm", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi import: " + e.getMessage()));
        }
    }

    // ==================== Download Template ====================

    @GetMapping("/khen-thuong/template")
    public ResponseEntity<byte[]> downloadKhenThuongTemplate() {
        try {
            byte[] data = generateKhenThuongTemplate();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=mau_import_khen_thuong.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            log.error("Lỗi tạo mẫu khen thưởng", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/vi-pham/template")
    public ResponseEntity<byte[]> downloadViPhamTemplate() {
        try {
            byte[] data = generateViPhamTemplate();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=mau_import_vi_pham.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            log.error("Lỗi tạo mẫu vi phạm", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== Helper methods ====================

    private boolean isValidExcelFile(MultipartFile file) {
        if (file == null || file.isEmpty()) return false;
        String filename = file.getOriginalFilename();
        if (filename == null) return false;
        String lower = filename.toLowerCase();
        return lower.endsWith(".xlsx") || lower.endsWith(".xls");
    }

    private byte[] generateKhenThuongTemplate() throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Khen thưởng");

            // Header style
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle centerStyle = createCenterDataStyle(workbook);

            // Title row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("MẪU IMPORT KHEN THƯỞNG");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            // Header row
            String[] headers = {"STT", "Mã học sinh", "Họ tên", "Lớp", "Nội dung", "Ngày khen (dd/MM/yyyy)"};
            Row headerRow = sheet.createRow(1);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Example data rows
            Object[][] examples = {
                {1, "HS001", "Nguyễn Văn A", "10A1", "Học sinh giỏi cấp thành phố", "15/05/2026"},
                {2, "HS002", "Trần Thị B", "10A2", "Đạt giải Olympic toán", "20/05/2026"},
                {3, "", "Lê Văn C", "11A1", "Tham gia tích cực hoạt động đoàn", "25/05/2026"}
            };

            for (int r = 0; r < examples.length; r++) {
                Row row = sheet.createRow(r + 2);
                for (int c = 0; c < examples[r].length; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellStyle(c == 0 || c == 1 || c == 3 ? centerStyle : dataStyle);
                    Object val = examples[r][c];
                    if (val instanceof Integer) {
                        cell.setCellValue((Integer) val);
                    } else {
                        cell.setCellValue(val != null ? val.toString() : "");
                    }
                }
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 1024);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private byte[] generateViPhamTemplate() throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Vi phạm");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle centerStyle = createCenterDataStyle(workbook);

            // Title row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("MẪU IMPORT VI PHẠM");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 6));

            // Header row
            String[] headers = {"STT", "Mã học sinh", "Họ tên", "Lớp", "Nội dung", "Mức độ", "Ngày vi phạm (dd/MM/yyyy)"};
            Row headerRow = sheet.createRow(1);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Example data rows
            Object[][] examples = {
                {1, "HS001", "Nguyễn Văn A", "10A1", "Đi trễ 15 phút", "NHE", "10/05/2026"},
                {2, "HS003", "Phạm Thị D", "10A2", "Không nộp bài tập", "TRUNG_BINH", "12/05/2026"},
                {3, "", "Hoàng Văn E", "11A1", "Vắng mặt không phép", "NGHIEM_TRONG", "18/05/2026"}
            };

            for (int r = 0; r < examples.length; r++) {
                Row row = sheet.createRow(r + 2);
                for (int c = 0; c < examples[r].length; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellStyle(c == 0 || c == 1 || c == 3 || c == 5 ? centerStyle : dataStyle);
                    Object val = examples[r][c];
                    if (val instanceof Integer) {
                        cell.setCellValue((Integer) val);
                    } else {
                        cell.setCellValue(val != null ? val.toString() : "");
                    }
                }
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 1024);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setWrapText(true);
        return style;
    }

    private CellStyle createDataStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createCenterDataStyle(XSSFWorkbook workbook) {
        CellStyle style = createDataStyle(workbook);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }
}
