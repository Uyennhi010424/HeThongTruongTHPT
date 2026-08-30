package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.repository.DiemRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.MonHocRepository;
import com.hethongtruongthpt.repository.AdminConfigRepository;
import com.hethongtruongthpt.entity.AdminConfig;
import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Document;
import com.itextpdf.text.Element;
import com.itextpdf.text.Font;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DiemPdfService {

    private static final List<String> nhanXetSubjects = Arrays.asList(
            "Giáo dục thể chất",
            "Hoạt động trải nghiệm, hướng nghiệp",
            "Nội dung giáo dục địa phương",
            "Giáo dục quốc phòng - An ninh",
            "Âm nhạc",
            "Mỹ thuật"
    );

    private final LopHocRepository lopHocRepository;
    private final MonHocRepository monHocRepository;
    private final HocSinhRepository hocSinhRepository;
    private final DiemRepository diemRepository;
    private final AdminConfigRepository adminConfigRepository;


    private com.itextpdf.text.pdf.BaseFont getBaseFont() {
        try {
            return com.itextpdf.text.pdf.BaseFont.createFont("C:/Windows/Fonts/arial.ttf", com.itextpdf.text.pdf.BaseFont.IDENTITY_H, com.itextpdf.text.pdf.BaseFont.EMBEDDED);
        } catch (Exception e) {
            try {
                return com.itextpdf.text.pdf.BaseFont.createFont(com.itextpdf.text.pdf.BaseFont.TIMES_ROMAN, com.itextpdf.text.pdf.BaseFont.CP1252, com.itextpdf.text.pdf.BaseFont.NOT_EMBEDDED);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    public DiemPdfService(LopHocRepository lopHocRepository,
                          MonHocRepository monHocRepository,
                          HocSinhRepository hocSinhRepository,
                          DiemRepository diemRepository,
                          AdminConfigRepository adminConfigRepository) {
        this.lopHocRepository = lopHocRepository;
        this.monHocRepository = monHocRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.diemRepository = diemRepository;
        this.adminConfigRepository = adminConfigRepository;
    }

    private String getSchoolName() {
        return adminConfigRepository.findByConfigKey("system_name")
                .map(AdminConfig::getConfigValue)
                .orElse("TRƯỜNG THPT");
    }

    public byte[] generateBangDiemLopPdf(Integer lopId, Integer monHocId,
                                          Integer hocKy, String namHoc) throws Exception {
        LopHoc lopHoc = lopHocRepository.findById(lopId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học với id: " + lopId));
        MonHoc monHoc = monHocRepository.findById(monHocId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học với id: " + monHocId));

        List<HocSinh> hocSinhs = hocSinhRepository.findByLopId(lopId);
        if (hocSinhs.isEmpty()) {
            throw new RuntimeException("Lớp " + lopHoc.getTenLop() + " không có học sinh nào.");
        }

        // Sort students by name
        hocSinhs.sort((a, b) -> String.CASE_INSENSITIVE_ORDER.compare(
                a.getHoTen() != null ? a.getHoTen() : "",
                b.getHoTen() != null ? b.getHoTen() : ""));

        // Get all diem for this class, subject, semester, year
        List<Diem> allDiem = diemRepository.findByHocKyAndNamHoc(hocKy, namHoc);
        // Filter by monHocId
        allDiem = allDiem.stream()
                .filter(d -> d.getMonHoc() != null && d.getMonHoc().getId().equals(monHocId))
                .collect(Collectors.toList());

        // Group diem by hocSinhId
        Map<Integer, List<Diem>> diemByHocSinh = allDiem.stream()
                .filter(d -> d.getHocSinh() != null)
                .collect(Collectors.groupingBy(d -> d.getHocSinh().getId()));

        // Build PDF
        Document document = new Document(PageSize.A4, 36, 36, 54, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        document.open();

        // School name header
        Font schoolFont = new Font(getBaseFont(), 12, Font.BOLD);
        Paragraph schoolName = new Paragraph(getSchoolName().toUpperCase(), schoolFont);
        schoolName.setAlignment(Element.ALIGN_LEFT);
        schoolName.setSpacingAfter(10);
        document.add(schoolName);

        // Title
        Font titleFont = new Font(getBaseFont(), 16, Font.BOLD);
        Paragraph title = new Paragraph("BẢNG ĐIỂM LỚP", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(8);
        document.add(title);

        // Subtitle: class, subject, semester, year
        Font subFont = new Font(getBaseFont(), 11);
        String hkLabel = hocKy == 1 ? "Học kỳ I" : "Học kỳ II";
        Paragraph sub = new Paragraph(
                "Lớp: " + lopHoc.getTenLop()
                        + "    |    Mon: " + monHoc.getTenMon()
                        + "    |    " + hkLabel
                        + "    |    Nam hoc: " + namHoc, subFont);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingAfter(16);
        document.add(sub);

        // Table: STT, Ma HS, Ho ten, TX avg, GK, CK, TB
        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 2f, 3.5f, 1.5f, 1.5f, 1.5f, 1.5f});

        // Header
        Font headerFont = new Font(getBaseFont(), 10, Font.BOLD, BaseColor.WHITE);
        BaseColor headerBg = new BaseColor(59, 130, 246);
        String[] headers = {"STT", "Mã HS", "Họ tên", "TX (avg)", "GK", "CK", "TB"};

        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(headerBg);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setPadding(7);
            table.addCell(cell);
        }

        // Data rows
        Font dataFont = new Font(getBaseFont(), 10);
        Font dataBoldFont = new Font(getBaseFont(), 10, Font.BOLD);
        BaseColor evenRowBg = new BaseColor(248, 251, 255);

        int stt = 0;
        for (HocSinh hs : hocSinhs) {
            stt++;
            List<Diem> hsDiem = diemByHocSinh.getOrDefault(hs.getId(), Collections.emptyList());

            // TX scores
            List<BigDecimal> txScores = hsDiem.stream()
                    .filter(d -> "TX".equals(d.getLoaiDiem())
                            || "MIENG".equals(d.getLoaiDiem())
                            || "MUOI_LAM_PHUT".equals(d.getLoaiDiem())
                            || "MOT_TIET".equals(d.getLoaiDiem()))
                    .map(Diem::getGiaTriDiem)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            // GK score
            BigDecimal gkScore = hsDiem.stream()
                    .filter(d -> "GK".equals(d.getLoaiDiem()) || "GIUA_KY".equals(d.getLoaiDiem()))
                    .map(Diem::getGiaTriDiem)
                    .filter(Objects::nonNull)
                    .findFirst().orElse(null);

            // CK score
            BigDecimal ckScore = hsDiem.stream()
                    .filter(d -> "CK".equals(d.getLoaiDiem()) || "CUOI_KY".equals(d.getLoaiDiem()))
                    .map(Diem::getGiaTriDiem)
                    .filter(Objects::nonNull)
                    .findFirst().orElse(null);

            // TX average
            BigDecimal txAvg = null;
            if (!txScores.isEmpty()) {
                BigDecimal txSum = txScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
                txAvg = txSum.divide(BigDecimal.valueOf(txScores.size()), 1, RoundingMode.HALF_UP);
            }

            // Semester average: (txSum + 2*gk + 3*ck) / (txCount + 2 + 3)
            BigDecimal tb = null;
            if (!txScores.isEmpty() || gkScore != null || ckScore != null) {
                BigDecimal txSum = txScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal gkVal = gkScore != null ? gkScore : BigDecimal.ZERO;
                BigDecimal ckVal = ckScore != null ? ckScore : BigDecimal.ZERO;
                int txCount = txScores.size();
                BigDecimal numerator = txSum.add(gkVal.multiply(BigDecimal.valueOf(2)))
                        .add(ckVal.multiply(BigDecimal.valueOf(3)));
                BigDecimal denominator = BigDecimal.valueOf(txCount + 5);
                if (denominator.compareTo(BigDecimal.ZERO) > 0) {
                    tb = numerator.divide(denominator, 1, RoundingMode.HALF_UP);
                }
            }

            BaseColor rowBg = (stt % 2 == 0) ? evenRowBg : BaseColor.WHITE;

            addCell(table, String.valueOf(stt), dataFont, rowBg, Element.ALIGN_CENTER);
            addCell(table, hs.getMaHocSinh() != null ? hs.getMaHocSinh() : "", dataFont, rowBg, Element.ALIGN_CENTER);
            addCell(table, hs.getHoTen() != null ? hs.getHoTen() : "", dataFont, rowBg, Element.ALIGN_LEFT);
            if (nhanXetSubjects.contains(monHoc.getTenMon()) || "NHAN_XET".equals(monHoc.getNhomDanhGia())) {
                addCell(table, "Đạt", dataFont, rowBg, Element.ALIGN_CENTER);
                addCell(table, "Đạt", dataFont, rowBg, Element.ALIGN_CENTER);
                addCell(table, "Đạt", dataFont, rowBg, Element.ALIGN_CENTER);
                addCell(table, "Đạt", dataBoldFont, rowBg, Element.ALIGN_CENTER);
            } else {
                addCell(table, txAvg != null ? txAvg.toPlainString() : "--", dataFont, rowBg, Element.ALIGN_CENTER);
                addCell(table, gkScore != null ? gkScore.toPlainString() : "--", dataFont, rowBg, Element.ALIGN_CENTER);
                addCell(table, ckScore != null ? ckScore.toPlainString() : "--", dataFont, rowBg, Element.ALIGN_CENTER);
                addCell(table, tb != null ? tb.toPlainString() : "--", dataBoldFont, rowBg, Element.ALIGN_CENTER);
            }
        }

        document.add(table);

        // Footer
        document.add(new Paragraph(" "));
        Font footerFont = new Font(getBaseFont(), 10, Font.ITALIC);
        Paragraph footer = new Paragraph("Tổng số: " + hocSinhs.size() + " học sinh", footerFont);
        footer.setAlignment(Element.ALIGN_RIGHT);
        document.add(footer);

        // Signature area
        document.add(new Paragraph(" "));
        Font sigFont = new Font(getBaseFont(), 10);
        Paragraph sigLeft = new Paragraph("Giáo viên bộ môn", sigFont);
        sigLeft.setAlignment(Element.ALIGN_LEFT);
        Paragraph sigRight = new Paragraph("Giáo viên chủ nhiệm", sigFont);
        sigRight.setAlignment(Element.ALIGN_RIGHT);

        PdfPTable sigTable = new PdfPTable(2);
        sigTable.setWidthPercentage(100);
        PdfPCell leftCell = new PdfPCell(new Phrase("(Ký, ghi rõ họ tên)", new Font(getBaseFont(), 9, Font.ITALIC)));
        leftCell.setBorder(PdfPCell.NO_BORDER);
        leftCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        PdfPCell rightCell = new PdfPCell(new Phrase("(Ký, ghi rõ họ tên)", new Font(getBaseFont(), 9, Font.ITALIC)));
        rightCell.setBorder(PdfPCell.NO_BORDER);
        rightCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        sigTable.addCell(leftCell);
        sigTable.addCell(rightCell);
        document.add(sigTable);

        document.close();
        return out.toByteArray();
    }

    private void addCell(PdfPTable table, String text, Font font, BaseColor bgColor, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(6);
        table.addCell(cell);
    }

    public byte[] generateBangDiemHocSinhPdf(Integer hocSinhId, Integer hocKy, String namHoc) throws Exception {
        HocSinh hocSinh = hocSinhRepository.findById(hocSinhId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học sinh với id: " + hocSinhId));
        LopHoc lopHoc = hocSinh.getLop();
        String tenLop = lopHoc != null ? lopHoc.getTenLop() : "Chua xep lop";

        List<Diem> diemList = diemRepository.findByHocSinhIdAndHocKyAndNamHoc(hocSinhId, hocKy, namHoc);
        Map<MonHoc, List<Diem>> diemByMonHoc = diemList.stream()
                .filter(d -> d.getMonHoc() != null)
                .collect(Collectors.groupingBy(Diem::getMonHoc));

        Document document = new Document(PageSize.A4, 36, 36, 54, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        document.open();

        // School Name
        Font schoolFont = new Font(getBaseFont(), 12, Font.BOLD);
        Paragraph schoolName = new Paragraph(getSchoolName().toUpperCase(), schoolFont);
        schoolName.setAlignment(Element.ALIGN_LEFT);
        schoolName.setSpacingAfter(10);
        document.add(schoolName);

        Font titleFont = new Font(getBaseFont(), 16, Font.BOLD);
        Paragraph title = new Paragraph("KẾT QUẢ HỌC TẬP", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(8);
        document.add(title);

        Font infoFont = new Font(getBaseFont(), 12);
        String hkLabel = hocKy == 1 ? "Học kỳ I" : "Học kỳ II";
        Paragraph info1 = new Paragraph("Họ tên: " + hocSinh.getHoTen() + "    |    Ma HS: " + hocSinh.getMaHocSinh(), infoFont);
        info1.setAlignment(Element.ALIGN_CENTER);
        Paragraph info2 = new Paragraph("Lớp: " + tenLop + "    |    " + hkLabel + "    |    Nam hoc: " + namHoc, infoFont);
        info2.setAlignment(Element.ALIGN_CENTER);
        info2.setSpacingAfter(16);
        document.add(info1);
        document.add(info2);

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 3.5f, 1.5f, 1.5f, 1.5f, 1.5f});

        Font headerFont = new Font(getBaseFont(), 10, Font.BOLD, BaseColor.WHITE);
        BaseColor headerBg = new BaseColor(59, 130, 246);
        String[] headers = {"STT", "Môn học", "TX (avg)", "GK", "CK", "TB"};

        for (String header : headers) {
            addCell(table, header, headerFont, headerBg, Element.ALIGN_CENTER);
        }

        Font dataFont = new Font(getBaseFont(), 10);
        Font dataBoldFont = new Font(getBaseFont(), 10, Font.BOLD);
        BaseColor evenRowBg = new BaseColor(248, 251, 255);

        int stt = 0;
        List<MonHoc> monHocs = diemByMonHoc.keySet().stream()
                .sorted((m1, m2) -> {
                    boolean isNx1 = nhanXetSubjects.contains(m1.getTenMon()) || "NHAN_XET".equals(m1.getNhomDanhGia());
                    boolean isNx2 = nhanXetSubjects.contains(m2.getTenMon()) || "NHAN_XET".equals(m2.getNhomDanhGia());
                    if (isNx1 && !isNx2) return 1;
                    if (!isNx1 && isNx2) return -1;
                    return m1.getTenMon().compareTo(m2.getTenMon());
                })
                .collect(Collectors.toList());

        for (MonHoc monHoc : monHocs) {
            stt++;
            List<Diem> hsDiem = diemByMonHoc.get(monHoc);

            List<BigDecimal> txScores = hsDiem.stream()
                    .filter(d -> "TX".equals(d.getLoaiDiem()) || "MIENG".equals(d.getLoaiDiem()) || "MUOI_LAM_PHUT".equals(d.getLoaiDiem()) || "MOT_TIET".equals(d.getLoaiDiem()))
                    .map(Diem::getGiaTriDiem).filter(Objects::nonNull).collect(Collectors.toList());

            BigDecimal gkScore = hsDiem.stream().filter(d -> "GK".equals(d.getLoaiDiem()) || "GIUA_KY".equals(d.getLoaiDiem())).map(Diem::getGiaTriDiem).filter(Objects::nonNull).findFirst().orElse(null);
            BigDecimal ckScore = hsDiem.stream().filter(d -> "CK".equals(d.getLoaiDiem()) || "CUOI_KY".equals(d.getLoaiDiem())).map(Diem::getGiaTriDiem).filter(Objects::nonNull).findFirst().orElse(null);

            BigDecimal txAvg = null;
            if (!txScores.isEmpty()) {
                BigDecimal txSum = txScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
                txAvg = txSum.divide(BigDecimal.valueOf(txScores.size()), 1, RoundingMode.HALF_UP);
            }

            BigDecimal tb = null;
            if (!txScores.isEmpty() || gkScore != null || ckScore != null) {
                BigDecimal txSum = txScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal gkVal = gkScore != null ? gkScore : BigDecimal.ZERO;
                BigDecimal ckVal = ckScore != null ? ckScore : BigDecimal.ZERO;
                int txCount = txScores.size();
                BigDecimal numerator = txSum.add(gkVal.multiply(BigDecimal.valueOf(2))).add(ckVal.multiply(BigDecimal.valueOf(3)));
                BigDecimal denominator = BigDecimal.valueOf(txCount + 5);
                if (denominator.compareTo(BigDecimal.ZERO) > 0) {
                    tb = numerator.divide(denominator, 1, RoundingMode.HALF_UP);
                }
            }

            BaseColor rowBg = (stt % 2 == 0) ? evenRowBg : BaseColor.WHITE;
            addCell(table, String.valueOf(stt), dataFont, rowBg, Element.ALIGN_CENTER);
            addCell(table, monHoc.getTenMon(), dataFont, rowBg, Element.ALIGN_LEFT);
            if (nhanXetSubjects.contains(monHoc.getTenMon()) || "NHAN_XET".equals(monHoc.getNhomDanhGia())) {
                addCell(table, "Đạt", dataFont, rowBg, Element.ALIGN_CENTER);
                addCell(table, "Đạt", dataFont, rowBg, Element.ALIGN_CENTER);
                addCell(table, "Đạt", dataFont, rowBg, Element.ALIGN_CENTER);
                addCell(table, "Đạt", dataBoldFont, rowBg, Element.ALIGN_CENTER);
            } else {
                addCell(table, txAvg != null ? txAvg.toPlainString() : "--", dataFont, rowBg, Element.ALIGN_CENTER);
                addCell(table, gkScore != null ? gkScore.toPlainString() : "--", dataFont, rowBg, Element.ALIGN_CENTER);
                addCell(table, ckScore != null ? ckScore.toPlainString() : "--", dataFont, rowBg, Element.ALIGN_CENTER);
                addCell(table, tb != null ? tb.toPlainString() : "--", dataBoldFont, rowBg, Element.ALIGN_CENTER);
            }
        }

        document.add(table);
        document.close();
        return out.toByteArray();
    }
}
