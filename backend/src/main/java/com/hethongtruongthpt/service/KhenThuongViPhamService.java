package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.khenthuong.KhenThuongRequest;
import com.hethongtruongthpt.dto.vipham.ViPhamRequest;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.KhenThuong;
import com.hethongtruongthpt.entity.ThongBao;
import com.hethongtruongthpt.entity.ViPham;
import com.hethongtruongthpt.enums.MucDoViPhamEnum;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.KhenThuongRepository;
import com.hethongtruongthpt.repository.ThongBaoRepository;
import com.hethongtruongthpt.repository.ViPhamRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class KhenThuongViPhamService {

    private static final Logger log = LoggerFactory.getLogger(KhenThuongViPhamService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final KhenThuongRepository khenThuongRepository;
    private final ViPhamRepository viPhamRepository;
    private final HocSinhRepository hocSinhRepository;
    private final ThongBaoRepository thongBaoRepository;

    public KhenThuongViPhamService(KhenThuongRepository khenThuongRepository,
                                   ViPhamRepository viPhamRepository,
                                   HocSinhRepository hocSinhRepository,
                                   ThongBaoRepository thongBaoRepository) {
        this.khenThuongRepository = khenThuongRepository;
        this.viPhamRepository = viPhamRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.thongBaoRepository = thongBaoRepository;
    }

    private void createNotification(HocSinh hocSinh, String tieuDe, String noiDung) {
        ThongBao tb = new ThongBao();
        tb.setTieuDe(tieuDe);
        tb.setNoiDung(noiDung);
        tb.setLoai("HOC_SINH");
        tb.setHocSinh(hocSinh);
        if (hocSinh.getUser() != null) {
            tb.setRecipientId(hocSinh.getUser().getId());
        }
        thongBaoRepository.save(tb);
    }

    // ==================== Khen Thuong ====================

    @Transactional
    public KhenThuong createKhenThuong(KhenThuongRequest request) {
        HocSinh hocSinh = hocSinhRepository.findById(request.getHocSinhId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy học sinh với ID: " + request.getHocSinhId()));

        KhenThuong khenThuong = new KhenThuong();
        khenThuong.setHocSinh(hocSinh);
        khenThuong.setNoiDung(request.getNoiDung());
        khenThuong.setNgayKhen(request.getNgayKhen());

        KhenThuong saved = khenThuongRepository.save(khenThuong);
        createNotification(hocSinh, "Bạn có khen thưởng mới", request.getNoiDung());
        return saved;
    }

    @Transactional
    public KhenThuong updateKhenThuong(Integer id, KhenThuongRequest request) {
        KhenThuong khenThuong = khenThuongRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy khen thưởng với ID: " + id));

        HocSinh hocSinh = hocSinhRepository.findById(request.getHocSinhId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy học sinh với ID: " + request.getHocSinhId()));

        khenThuong.setHocSinh(hocSinh);
        khenThuong.setNoiDung(request.getNoiDung());
        khenThuong.setNgayKhen(request.getNgayKhen());

        return khenThuongRepository.save(khenThuong);
    }

    @Transactional
    public void deleteKhenThuong(Integer id) {
        KhenThuong khenThuong = khenThuongRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy khen thưởng với ID: " + id));
        khenThuongRepository.delete(khenThuong);
    }

    // ==================== Vi Pham ====================

    @Transactional
    public ViPham createViPham(ViPhamRequest request) {
        HocSinh hocSinh = hocSinhRepository.findById(request.getHocSinhId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy học sinh với ID: " + request.getHocSinhId()));

        ViPham viPham = new ViPham();
        viPham.setHocSinh(hocSinh);
        viPham.setNoiDung(request.getNoiDung());
        viPham.setMucDo(request.getMucDo());
        viPham.setNgayViPham(request.getNgayViPham());

        ViPham saved = viPhamRepository.save(viPham);
        createNotification(hocSinh, "Thông báo vi phạm", request.getNoiDung() + " (Mức độ: " + request.getMucDo() + ")");
        return saved;
    }

    @Transactional
    public ViPham updateViPham(Integer id, ViPhamRequest request) {
        ViPham viPham = viPhamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy vi phạm với ID: " + id));

        HocSinh hocSinh = hocSinhRepository.findById(request.getHocSinhId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy học sinh với ID: " + request.getHocSinhId()));

        viPham.setHocSinh(hocSinh);
        viPham.setNoiDung(request.getNoiDung());
        viPham.setMucDo(request.getMucDo());
        viPham.setNgayViPham(request.getNgayViPham());

        return viPhamRepository.save(viPham);
    }

    @Transactional
    public void deleteViPham(Integer id) {
        ViPham viPham = viPhamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy vi phạm với ID: " + id));
        viPhamRepository.delete(viPham);
    }

    // ==================== Import from Excel ====================

    @Transactional
    public ImportResult importKhenThuongFromExcel(InputStream inputStream) {
        ImportResult result = new ImportResult();
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            int lastRow = sheet.getLastRowNum();
            result.setTotalRows(Math.max(0, lastRow - 1)); // row 0 = title, row 1 = header

            for (int i = 2; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) {
                    result.setTotalRows(result.getTotalRows() - 1);
                    continue;
                }

                try {
                    // Column 0: STT (skip), Column 1: Ma HS, Column 2: Ho ten (optional),
                    // Column 3: Lop (optional), Column 4: Noi dung, Column 5: Ngay khen
                    String maHocSinh = getCellStringValue(row, 1);
                    String hoTen = getCellStringValue(row, 2);
                    String noiDung = getCellStringValue(row, 4);
                    LocalDate ngayKhen = getCellDateValue(row, 5);

                    if (noiDung.isEmpty()) {
                        errors.add("Dòng " + (i + 1) + ": Nội dung không được để trống");
                        result.setFailedCount(result.getFailedCount() + 1);
                        continue;
                    }

                    Optional<HocSinh> hocSinhOpt = findHocSinh(maHocSinh, hoTen, i + 1, errors);
                    if (hocSinhOpt.isEmpty()) {
                        result.setFailedCount(result.getFailedCount() + 1);
                        continue;
                    }

                    KhenThuong khenThuong = new KhenThuong();
                    khenThuong.setHocSinh(hocSinhOpt.get());
                    khenThuong.setNoiDung(noiDung);
                    khenThuong.setNgayKhen(ngayKhen);
                    khenThuongRepository.save(khenThuong);
                    createNotification(hocSinhOpt.get(), "Bạn có khen thưởng mới", noiDung);
                    result.setSuccessCount(result.getSuccessCount() + 1);

                } catch (Exception e) {
                    log.error("Lỗi import khen thưởng dòng {}: {}", i + 1, e.getMessage());
                    errors.add("Dòng " + (i + 1) + ": " + e.getMessage());
                    result.setFailedCount(result.getFailedCount() + 1);
                }
            }
        } catch (Exception e) {
            log.error("Lỗi đọc file Excel khen thưởng", e);
            errors.add("Lỗi đọc file Excel: " + e.getMessage());
        }

        result.setErrors(errors);
        return result;
    }

    @Transactional
    public ImportResult importViPhamFromExcel(InputStream inputStream) {
        ImportResult result = new ImportResult();
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            int lastRow = sheet.getLastRowNum();
            result.setTotalRows(Math.max(0, lastRow - 1)); // row 0 = title, row 1 = header

            for (int i = 2; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) {
                    result.setTotalRows(result.getTotalRows() - 1);
                    continue;
                }

                try {
                    // Column 0: STT, Column 1: Ma HS, Column 2: Ho ten (optional),
                    // Column 3: Lop (optional), Column 4: Noi dung, Column 5: Muc do, Column 6: Ngay vi pham
                    String maHocSinh = getCellStringValue(row, 1);
                    String hoTen = getCellStringValue(row, 2);
                    String noiDung = getCellStringValue(row, 4);
                    String mucDoStr = getCellStringValue(row, 5);
                    LocalDate ngayViPham = getCellDateValue(row, 6);

                    if (noiDung.isEmpty()) {
                        errors.add("Dòng " + (i + 1) + ": Nội dung không được để trống");
                        result.setFailedCount(result.getFailedCount() + 1);
                        continue;
                    }

                    MucDoViPhamEnum mucDo = parseMucDo(mucDoStr);
                    if (mucDo == null && !mucDoStr.isEmpty()) {
                        errors.add("Dòng " + (i + 1) + ": Mức độ '" + mucDoStr
                                + "' không hợp lệ (chấp nhận: NHE, TRUNG_BINH, NGHIEM_TRONG, Nhẹ, Trung bình, Nghiêm trọng)");
                        result.setFailedCount(result.getFailedCount() + 1);
                        continue;
                    }
                    if (mucDo == null) {
                        mucDo = MucDoViPhamEnum.NHE; // default
                    }

                    Optional<HocSinh> hocSinhOpt = findHocSinh(maHocSinh, hoTen, i + 1, errors);
                    if (hocSinhOpt.isEmpty()) {
                        result.setFailedCount(result.getFailedCount() + 1);
                        continue;
                    }

                    ViPham viPham = new ViPham();
                    viPham.setHocSinh(hocSinhOpt.get());
                    viPham.setNoiDung(noiDung);
                    viPham.setMucDo(mucDo);
                    viPham.setNgayViPham(ngayViPham);
                    viPhamRepository.save(viPham);
                    createNotification(hocSinhOpt.get(), "Thông báo vi phạm", noiDung + " (Mức độ: " + mucDo + ")");
                    result.setSuccessCount(result.getSuccessCount() + 1);

                } catch (Exception e) {
                    log.error("Lỗi import vi phạm dòng {}: {}", i + 1, e.getMessage());
                    errors.add("Dòng " + (i + 1) + ": " + e.getMessage());
                    result.setFailedCount(result.getFailedCount() + 1);
                }
            }
        } catch (Exception e) {
            log.error("Lỗi đọc file Excel vi phạm", e);
            errors.add("Lỗi đọc file Excel: " + e.getMessage());
        }

        result.setErrors(errors);
        return result;
    }

    // ==================== Helper methods ====================

    private Optional<HocSinh> findHocSinh(String maHocSinh, String hoTen,
                                           int rowNum, List<String> errors) {
        // Try by maHocSinh first
        if (maHocSinh != null && !maHocSinh.isEmpty()) {
            Optional<HocSinh> byMa = hocSinhRepository.findByMaHocSinh(maHocSinh);
            if (byMa.isPresent()) {
                return byMa;
            }
        }

        // Fallback: search by hoTen
        if (hoTen != null && !hoTen.isEmpty()) {
            List<HocSinh> all = hocSinhRepository.findAll();
            Optional<HocSinh> byName = all.stream()
                    .filter(h -> hoTen.equalsIgnoreCase(h.getHoTen()))
                    .findFirst();
            if (byName.isPresent()) {
                return byName;
            }
        }

        String identifier = (maHocSinh != null && !maHocSinh.isEmpty())
                ? "mã '" + maHocSinh + "'"
                : "tên '" + hoTen + "'";
        errors.add("Dòng " + rowNum + ": Không tìm thấy học sinh với " + identifier);
        return Optional.empty();
    }

    private String getCellStringValue(Row row, int colIndex) {
        Cell cell = row.getCell(colIndex);
        if (cell == null) return "";
        if (cell.getCellType() == CellType.NUMERIC) {
            // Handle numeric cells (e.g. student code stored as number)
            double val = cell.getNumericCellValue();
            if (val == Math.floor(val) && !Double.isInfinite(val)) {
                return String.valueOf((long) val);
            }
            return String.valueOf(val);
        }
        return cell.toString().trim();
    }

    private LocalDate getCellDateValue(Row row, int colIndex) {
        Cell cell = row.getCell(colIndex);
        if (cell == null) return null;

        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            Date date = cell.getDateCellValue();
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }

        // Try parsing as string (dd/MM/yyyy or yyyy-MM-dd)
        String dateStr = getCellStringValue(row, colIndex);
        if (dateStr.isEmpty()) return null;

        // Try dd/MM/yyyy
        try {
            return LocalDate.parse(dateStr, DATE_FMT);
        } catch (DateTimeParseException ignored) {}

        // Try yyyy-MM-dd
        try {
            return LocalDate.parse(dateStr);
        } catch (DateTimeParseException ignored) {}

        log.warn("Không thể parse ngày: '{}', sử dụng null", dateStr);
        return null;
    }

    private boolean isRowEmpty(Row row) {
        for (int c = 0; c < 7; c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK
                    && !getCellStringValue(row, c).isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private MucDoViPhamEnum parseMucDo(String value) {
        if (value == null || value.isEmpty()) return null;
        String normalized = value.trim().toUpperCase()
                .replace(" ", "_")
                .replace("ĐỘ", "DO"); // handle Vietnamese
        // Direct enum match
        for (MucDoViPhamEnum e : MucDoViPhamEnum.values()) {
            if (e.name().equals(normalized)) return e;
        }
        // Vietnamese label match
        if (normalized.contains("NHE") || normalized.contains("NHẸ")) return MucDoViPhamEnum.NHE;
        if (normalized.contains("TRUNG") && normalized.contains("BINH")) return MucDoViPhamEnum.TRUNG_BINH;
        if (normalized.contains("NGHIEM") || normalized.contains("NGHIÊM")) return MucDoViPhamEnum.NGHIEM_TRONG;
        return null;
    }

    // ==================== Import Result DTO ====================

    public static class ImportResult {
        private int totalRows;
        private int successCount;
        private int failedCount;
        private List<String> errors = new ArrayList<>();

        public int getTotalRows() { return totalRows; }
        public void setTotalRows(int totalRows) { this.totalRows = totalRows; }
        public int getSuccessCount() { return successCount; }
        public void setSuccessCount(int successCount) { this.successCount = successCount; }
        public int getFailedCount() { return failedCount; }
        public void setFailedCount(int failedCount) { this.failedCount = failedCount; }
        public List<String> getErrors() { return errors; }
        public void setErrors(List<String> errors) { this.errors = errors; }
    }
}
