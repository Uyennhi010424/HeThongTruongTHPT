package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.repository.DiemRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExcelExportService {

    private static final Logger log = LoggerFactory.getLogger(ExcelExportService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final HocSinhRepository hocSinhRepository;
    private final LopHocRepository lopHocRepository;
    private final DiemRepository diemRepository;

    public ExcelExportService(HocSinhRepository hocSinhRepository,
                              LopHocRepository lopHocRepository,
                              DiemRepository diemRepository) {
        this.hocSinhRepository = hocSinhRepository;
        this.lopHocRepository = lopHocRepository;
        this.diemRepository = diemRepository;
    }

    /**
     * Export danh sach hoc sinh ra file Excel.
     *
     * @param lopId  ID lop (optional)
     * @param khoi   Khoi 10/11/12 (optional)
     * @return byte[] noi dung file .xlsx
     */
    public byte[] exportHocSinhList(Integer lopId, Integer khoi) {
        List<HocSinh> hocSinhList;

        if (lopId != null) {
            hocSinhList = hocSinhRepository.findByLopId(lopId);
        } else if (khoi != null) {
            List<LopHoc> lops = lopHocRepository.findByKhoi(khoi);
            Set<Integer> lopIds = lops.stream()
                    .map(LopHoc::getId)
                    .collect(Collectors.toSet());
            hocSinhList = hocSinhRepository.findAll().stream()
                    .filter(h -> h.getLop() != null && lopIds.contains(h.getLop().getId()))
                    .collect(Collectors.toList());
        } else {
            hocSinhList = hocSinhRepository.findAll();
        }

        if (hocSinhList.isEmpty()) {
            throw new ApiException("Không có dữ liệu học sinh để xuất");
        }

        // Sort: khoi -> ten lop -> ho ten
        hocSinhList.sort((a, b) -> {
            int cmp = Integer.compare(
                    a.getLop() != null ? a.getLop().getKhoi() : 0,
                    b.getLop() != null ? b.getLop().getKhoi() : 0);
            if (cmp != 0) return cmp;
            cmp = nullSafeCompare(
                    a.getLop() != null ? a.getLop().getTenLop() : "",
                    b.getLop() != null ? b.getLop().getTenLop() : "");
            if (cmp != 0) return cmp;
            return nullSafeCompare(a.getHoTen(), b.getHoTen());
        });

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Danh sách học sinh");

            // -- Header style --
            CellStyle headerStyle = createHeaderStyle(workbook);

            // -- Data style --
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle centerStyle = createCenterDataStyle(workbook);

            // -- Title row --
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            String titleText = "DANH SÁCH HỌC SINH";
            if (lopId != null) {
                hocSinhList.stream().findFirst().ifPresent(h -> {
                    if (h.getLop() != null) {
                        // will be set below
                    }
                });
            }
            titleCell.setCellValue(titleText);
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            // -- Header row --
            String[] headers = {"STT", "Mã học sinh", "Họ và tên", "Ngày sinh", "Giới tính", "Lớp"};
            Row headerRow = sheet.createRow(1);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // -- Data rows --
            int rowNum = 2;
            int stt = 1;
            for (HocSinh hs : hocSinhList) {
                Row row = sheet.createRow(rowNum++);

                Cell cellSTT = row.createCell(0);
                cellSTT.setCellValue(stt++);
                cellSTT.setCellStyle(centerStyle);

                Cell cellMaHS = row.createCell(1);
                cellMaHS.setCellValue(hs.getMaHocSinh() != null ? hs.getMaHocSinh() : "");
                cellMaHS.setCellStyle(centerStyle);

                Cell cellHoTen = row.createCell(2);
                cellHoTen.setCellValue(hs.getHoTen() != null ? hs.getHoTen() : "");
                cellHoTen.setCellStyle(dataStyle);

                Cell cellNgaySinh = row.createCell(3);
                if (hs.getNgaySinh() != null) {
                    cellNgaySinh.setCellValue(hs.getNgaySinh().format(DATE_FMT));
                } else {
                    cellNgaySinh.setCellValue("");
                }
                cellNgaySinh.setCellStyle(centerStyle);

                Cell cellGioiTinh = row.createCell(4);
                cellGioiTinh.setCellValue(formatGioiTinh(hs.getGioiTinh()));
                cellGioiTinh.setCellStyle(centerStyle);

                Cell cellLop = row.createCell(5);
                cellLop.setCellValue(hs.getLop() != null ? hs.getLop().getTenLop() : "");
                cellLop.setCellStyle(centerStyle);
            }

            // -- Auto-size columns --
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                // Add extra padding
                int currentWidth = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, currentWidth + 512);
            }

            // -- Write to byte array --
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();

        } catch (IOException e) {
            log.error("Lỗi khi xuất Excel danh sách học sinh", e);
            throw new ApiException("Lỗi khi tạo file Excel: " + e.getMessage());
        }
    }

    /**
     * Export bang diem cua lop theo mon hoc, hoc ky, nam hoc.
     * Tinh diem TB theo Thong tu 22: (sumTX + 2*GK + 3*CK) / (countTX + 5)
     *
     * @param lopId     ID lop
     * @param monHocId  ID mon hoc
     * @param hocKy     Hoc ky (1 or 2)
     * @param namHoc    Nam hoc (VD: 2025-2026)
     * @return byte[] noi dung file .xlsx
     */
    public byte[] exportBangDiemLop(Integer lopId, Integer monHocId, Integer hocKy, String namHoc) {
        if (lopId == null || monHocId == null || hocKy == null || namHoc == null || namHoc.isBlank()) {
            throw new ApiException("Thiếu thông tin: lopId, monHocId, hocKy, namHoc là bắt buộc");
        }

        // Get students in the class
        List<HocSinh> hocSinhList = hocSinhRepository.findByLopId(lopId);
        if (hocSinhList.isEmpty()) {
            throw new ApiException("Không có học sinh trong lớp");
        }

        // Sort by ho ten
        hocSinhList.sort((a, b) -> nullSafeCompare(a.getHoTen(), b.getHoTen()));

        // Get all diem for these students in this monHoc + hocKy + namHoc
        // Build map: hocSinhId -> list of Diem
        Map<Integer, List<Diem>> diemMap = new HashMap<>();
        for (HocSinh hs : hocSinhList) {
            List<Diem> allDiem = diemRepository.findByHocSinhIdAndNamHoc(hs.getId(), namHoc);
            List<Diem> filtered = allDiem.stream()
                    .filter(d -> d.getMonHoc() != null && d.getMonHoc().getId().equals(monHocId)
                            && d.getHocKy().equals(hocKy))
                    .collect(Collectors.toList());
            diemMap.put(hs.getId(), filtered);
        }

        // Determine max number of TX columns
        int maxTX = 0;
        for (List<Diem> diemList : diemMap.values()) {
            long txCount = diemList.stream()
                    .filter(d -> "TX".equals(d.getLoaiDiem()))
                    .count();
            if (txCount > maxTX) maxTX = (int) txCount;
        }
        if (maxTX == 0) maxTX = 1; // At least 1 TX column

        // Header columns: STT, Mã HS, Họ tên, TX1..TXn, GK, CK, TB
        int totalCols = 3 + maxTX + 3; // STT + MaHS + HoTen + TX* + GK + CK + TB

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Bảng điểm");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle centerStyle = createCenterDataStyle(workbook);
            CellStyle numberStyle = createNumberDataStyle(workbook);

            // -- Title row --
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BẢNG ĐIỂM");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, totalCols - 1));

            // -- Info row --
            Row infoRow = sheet.createRow(1);
            CellStyle infoStyle = workbook.createCellStyle();
            Font infoFont = workbook.createFont();
            infoFont.setItalic(true);
            infoStyle.setFont(infoFont);
            Cell infoCell = infoRow.createCell(0);
            // Get class name and subject name
            String tenLop = lopHocRepository.findById(lopId)
                    .map(LopHoc::getTenLop)
                    .orElse("N/A");
            String tenMon = hocSinhList.stream().findFirst()
                    .flatMap(h -> diemMap.get(h.getId()).stream().findFirst())
                    .map(d -> d.getMonHoc().getTenMon())
                    .orElse("N/A");
            infoCell.setCellValue("Lớp: " + tenLop + "  |  Môn: " + tenMon
                    + "  |  Học kỳ: " + hocKy + "  |  Năm học: " + namHoc);
            infoCell.setCellStyle(infoStyle);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, totalCols - 1));

            // -- Header row --
            Row headerRow = sheet.createRow(2);
            int colIdx = 0;
            setHeaderCell(headerRow, colIdx++, "STT", headerStyle);
            setHeaderCell(headerRow, colIdx++, "Mã học sinh", headerStyle);
            setHeaderCell(headerRow, colIdx++, "Họ và tên", headerStyle);
            for (int i = 1; i <= maxTX; i++) {
                setHeaderCell(headerRow, colIdx++, "TX" + i, headerStyle);
            }
            setHeaderCell(headerRow, colIdx++, "GK", headerStyle);
            setHeaderCell(headerRow, colIdx++, "CK", headerStyle);
            setHeaderCell(headerRow, colIdx++, "TB", headerStyle);

            // -- Data rows --
            int rowNum = 3;
            int stt = 1;
            for (HocSinh hs : hocSinhList) {
                Row row = sheet.createRow(rowNum++);
                List<Diem> diemList = diemMap.getOrDefault(hs.getId(), Collections.emptyList());

                // Separate TX, GK, CK
                List<Diem> txList = diemList.stream()
                        .filter(d -> "TX".equals(d.getLoaiDiem()))
                        .sorted(Comparator.comparingInt(Diem::getSoThuTu))
                        .collect(Collectors.toList());
                Diem gkDiem = diemList.stream()
                        .filter(d -> "GK".equals(d.getLoaiDiem()))
                        .findFirst().orElse(null);
                Diem ckDiem = diemList.stream()
                        .filter(d -> "CK".equals(d.getLoaiDiem()))
                        .findFirst().orElse(null);

                int c = 0;
                // STT
                Cell cellSTT = row.createCell(c++);
                cellSTT.setCellValue(stt++);
                cellSTT.setCellStyle(centerStyle);

                // Ma HS
                Cell cellMaHS = row.createCell(c++);
                cellMaHS.setCellValue(hs.getMaHocSinh() != null ? hs.getMaHocSinh() : "");
                cellMaHS.setCellStyle(centerStyle);

                // Ho ten
                Cell cellHoTen = row.createCell(c++);
                cellHoTen.setCellValue(hs.getHoTen() != null ? hs.getHoTen() : "");
                cellHoTen.setCellStyle(dataStyle);

                // TX columns
                BigDecimal sumTX = BigDecimal.ZERO;
                int countTX = 0;
                for (int i = 0; i < maxTX; i++) {
                    Cell cellTX = row.createCell(c++);
                    if (i < txList.size() && txList.get(i).getGiaTriDiem() != null) {
                        BigDecimal val = txList.get(i).getGiaTriDiem();
                        cellTX.setCellValue(val.doubleValue());
                        sumTX = sumTX.add(val);
                        countTX++;
                    } else {
                        cellTX.setCellValue("");
                    }
                    cellTX.setCellStyle(numberStyle);
                }

                // GK
                Cell cellGK = row.createCell(c++);
                BigDecimal gkVal = (gkDiem != null && gkDiem.getGiaTriDiem() != null)
                        ? gkDiem.getGiaTriDiem() : null;
                if (gkVal != null) {
                    cellGK.setCellValue(gkVal.doubleValue());
                } else {
                    cellGK.setCellValue("");
                }
                cellGK.setCellStyle(numberStyle);

                // CK
                Cell cellCK = row.createCell(c++);
                BigDecimal ckVal = (ckDiem != null && ckDiem.getGiaTriDiem() != null)
                        ? ckDiem.getGiaTriDiem() : null;
                if (ckVal != null) {
                    cellCK.setCellValue(ckVal.doubleValue());
                } else {
                    cellCK.setCellValue("");
                }
                cellCK.setCellStyle(numberStyle);

                // TB - Trung binh theo Thong tu 22: (sumTX + 2*GK + 3*CK) / (countTX + 5)
                Cell cellTB = row.createCell(c++);
                if (gkVal != null && ckVal != null && countTX > 0) {
                    BigDecimal numerator = sumTX
                            .add(gkVal.multiply(BigDecimal.valueOf(2)))
                            .add(ckVal.multiply(BigDecimal.valueOf(3)));
                    BigDecimal denominator = BigDecimal.valueOf(countTX + 5);
                    BigDecimal tb = numerator.divide(denominator, 1, RoundingMode.HALF_UP);
                    cellTB.setCellValue(tb.doubleValue());
                } else {
                    cellTB.setCellValue("");
                }
                cellTB.setCellStyle(numberStyle);
            }

            // -- Auto-size columns --
            for (int i = 0; i < totalCols; i++) {
                sheet.autoSizeColumn(i);
                int currentWidth = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, currentWidth + 512);
            }

            // -- Write to byte array --
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();

        } catch (IOException e) {
            log.error("Lỗi khi xuất Excel bảng điểm", e);
            throw new ApiException("Lỗi khi tạo file Excel: " + e.getMessage());
        }
    }

    // ==================== Helper methods ====================

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

    private CellStyle createDateStyle(XSSFWorkbook workbook) {
        CellStyle style = createCenterDataStyle(workbook);
        return style;
    }

    private CellStyle createNumberDataStyle(XSSFWorkbook workbook) {
        CellStyle style = createDataStyle(workbook);
        style.setAlignment(HorizontalAlignment.CENTER);
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("0.0"));
        return style;
    }

    private void setHeaderCell(Row row, int colIndex, String value, CellStyle style) {
        Cell cell = row.createCell(colIndex);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private String formatGioiTinh(String gioiTinh) {
        if (gioiTinh == null) return "";
        if ("NAM".equalsIgnoreCase(gioiTinh)) return "Nam";
        if ("NU".equalsIgnoreCase(gioiTinh)) return "Nữ";
        return gioiTinh;
    }

    private int nullSafeCompare(String a, String b) {
        if (a == null && b == null) return 0;
        if (a == null) return -1;
        if (b == null) return 1;
        return a.compareToIgnoreCase(b);
    }
}
