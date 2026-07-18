package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.service.DiemPdfService;
import com.hethongtruongthpt.service.ExcelExportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private static final Logger log = LoggerFactory.getLogger(ExportController.class);
    private static final String EXCEL_CONTENT_TYPE =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private final ExcelExportService excelExportService;
    private final DiemPdfService diemPdfService;

    public ExportController(ExcelExportService excelExportService, DiemPdfService diemPdfService) {
        this.excelExportService = excelExportService;
        this.diemPdfService = diemPdfService;
    }

    /**
     * Xuat danh sach hoc sinh ra file Excel.
     * GET /api/export/hocsinh/excel?lopId=1
     * GET /api/export/hocsinh/excel?khoi=10
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/hocsinh/excel")
    public ResponseEntity<byte[]> exportHocSinhExcel(
            @RequestParam(required = false) Integer lopId,
            @RequestParam(required = false) Integer khoi) {
        try {
            byte[] excelBytes = excelExportService.exportHocSinhList(lopId, khoi);

            String filename = "danh_sach_hoc_sinh";
            if (lopId != null) {
                filename += "_lop" + lopId;
            } else if (khoi != null) {
                filename += "_khoi" + khoi;
            }
            filename += ".xlsx";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=" + filename)
                    .contentType(MediaType.parseMediaType(EXCEL_CONTENT_TYPE))
                    .contentLength(excelBytes.length)
                    .body(excelBytes);
        } catch (Exception e) {
            log.error("Lỗi khi xuất Excel danh sách học sinh", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Xuat bang diem lop ra file Excel.
     * GET /api/export/diem/excel?lopId=1&monHocId=1&hocKy=1&namHoc=2025-2026
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/diem/excel")
    public ResponseEntity<byte[]> exportBangDiemExcel(
            @RequestParam Integer lopId,
            @RequestParam Integer monHocId,
            @RequestParam Integer hocKy,
            @RequestParam String namHoc) {
        try {
            byte[] excelBytes = excelExportService.exportBangDiemLop(lopId, monHocId, hocKy, namHoc);

            String filename = "bang_diem_lop" + lopId
                    + "_mon" + monHocId
                    + "_hk" + hocKy
                    + "_" + namHoc.replace("-", "")
                    + ".xlsx";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=" + filename)
                    .contentType(MediaType.parseMediaType(EXCEL_CONTENT_TYPE))
                    .contentLength(excelBytes.length)
                    .body(excelBytes);
        } catch (Exception e) {
            log.error("Lỗi khi xuất Excel bảng điểm", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Xuat bang diem lop ra file PDF.
     * GET /api/export/diem/pdf?lopId=1&monHocId=1&hocKy=1&namHoc=2025-2026
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    @GetMapping("/diem/pdf")
    public ResponseEntity<byte[]> exportBangDiemPdf(
            @RequestParam Integer lopId,
            @RequestParam Integer monHocId,
            @RequestParam Integer hocKy,
            @RequestParam String namHoc) {
        try {
            byte[] pdfBytes = diemPdfService.generateBangDiemLopPdf(lopId, monHocId, hocKy, namHoc);

            String filename = "bang_diem_lop" + lopId
                    + "_mon" + monHocId
                    + "_hk" + hocKy
                    + "_" + namHoc.replace("-", "")
                    + ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=" + filename)
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdfBytes.length)
                    .body(pdfBytes);
        } catch (Exception e) {
            log.error("Lỗi khi xuất PDF bảng điểm", e);
            return ResponseEntity.badRequest().build();
        }
    }
}
