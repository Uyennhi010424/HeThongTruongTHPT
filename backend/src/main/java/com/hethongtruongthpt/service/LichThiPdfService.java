package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.LichThi;
import com.hethongtruongthpt.repository.LichThiRepository;
import com.hethongtruongthpt.repository.AdminConfigRepository;
import com.hethongtruongthpt.entity.AdminConfig;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class LichThiPdfService {
    private final LichThiRepository lichThiRepository;
    private final AdminConfigRepository adminConfigRepository;

    public LichThiPdfService(LichThiRepository lichThiRepository, AdminConfigRepository adminConfigRepository) {
        this.lichThiRepository = lichThiRepository;
        this.adminConfigRepository = adminConfigRepository;
    }

    private String getSchoolName() {
        return adminConfigRepository.findByConfigKey("system_name")
                .map(AdminConfig::getConfigValue)
                .orElse("TRƯỜNG THPT");
    }

    public byte[] generatePdf(String namHoc, Integer hocKy) throws Exception {
        List<LichThi> lichThis = lichThiRepository.findByNamHocAndHocKy(namHoc, hocKy);

        if (lichThis.isEmpty()) {
            throw new RuntimeException("Không có lịch thi cho năm học " + namHoc + " học kỳ " + hocKy);
        }

        // Sort by ngayThi, then gioBatDau
        lichThis.sort((a, b) -> {
            int cmp = a.getNgayThi().compareTo(b.getNgayThi());
            if (cmp != 0) return cmp;
            return a.getGioBatDau().compareTo(b.getGioBatDau());
        });

        Document document = new Document(PageSize.A4.rotate(), 36, 36, 54, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);

        document.open();

        // School Name
        Font schoolFont = new Font(Font.FontFamily.TIMES_ROMAN, 12, Font.BOLD);
        Paragraph schoolName = new Paragraph(getSchoolName().toUpperCase(), schoolFont);
        schoolName.setAlignment(Element.ALIGN_LEFT);
        schoolName.setSpacingAfter(10);
        document.add(schoolName);

        // Title
        Font titleFont = new Font(Font.FontFamily.TIMES_ROMAN, 18, Font.BOLD);
        Paragraph title = new Paragraph("LỊCH THI NĂM HỌC " + namHoc + " - HỌC KỲ " + hocKy, titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);

        // Table
        PdfPTable table = new PdfPTable(8);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 2f, 2f, 1.5f, 1.5f, 1.5f, 2f, 2.5f});

        // Header
        Font headerFont = new Font(Font.FontFamily.TIMES_ROMAN, 11, Font.BOLD, BaseColor.WHITE);
        BaseColor headerBg = new BaseColor(59, 130, 246);

        String[] headers = {"Ngày thi", "Lớp", "Môn thi", "Loại KT", "Giờ bắt đầu", "Thời gian", "Phòng thi", "Giám thị"};

        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(headerBg);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setPadding(8);
            table.addCell(cell);
        }

        // Data rows
        Font dataFont = new Font(Font.FontFamily.TIMES_ROMAN, 10);
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        BaseColor evenRowBg = new BaseColor(248, 251, 255);

        for (int i = 0; i < lichThis.size(); i++) {
            LichThi lt = lichThis.get(i);
            BaseColor rowBg = (i % 2 == 0) ? BaseColor.WHITE : evenRowBg;

            addCell(table, lt.getNgayThi().format(dateFormatter), dataFont, rowBg, Element.ALIGN_CENTER);
            addCell(table, lt.getLop() != null ? lt.getLop().getTenLop() : "", dataFont, rowBg, Element.ALIGN_CENTER);
            addCell(table, lt.getMonHoc() != null ? lt.getMonHoc().getTenMon() : "", dataFont, rowBg, Element.ALIGN_LEFT);
            addCell(table, lt.getLoaiKiemTra() != null ? lt.getLoaiKiemTra() : "", dataFont, rowBg, Element.ALIGN_CENTER);
            addCell(table, lt.getGioBatDau().format(timeFormatter), dataFont, rowBg, Element.ALIGN_CENTER);
            addCell(table, lt.getThoiGianLamBai() + " phút", dataFont, rowBg, Element.ALIGN_CENTER);
            addCell(table, lt.getPhongThi() != null ? lt.getPhongThi() : "", dataFont, rowBg, Element.ALIGN_CENTER);

            // Giám thị
            String giamThi = "";
            if (lt.getGiamThi1() != null) {
                giamThi = lt.getGiamThi1().getHoTen();
            }
            if (lt.getGiamThi2() != null) {
                giamThi += (giamThi.isEmpty() ? "" : ", ") + lt.getGiamThi2().getHoTen();
            }
            addCell(table, giamThi, dataFont, rowBg, Element.ALIGN_LEFT);
        }

        document.add(table);

        // Footer
        document.add(new Paragraph(" "));
        Font footerFont = new Font(Font.FontFamily.TIMES_ROMAN, 10, Font.ITALIC);
        Paragraph footer = new Paragraph("Tổng số: " + lichThis.size() + " lịch thi", footerFont);
        footer.setAlignment(Element.ALIGN_RIGHT);
        document.add(footer);

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
}
