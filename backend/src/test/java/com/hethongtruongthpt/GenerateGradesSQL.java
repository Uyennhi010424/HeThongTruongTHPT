package com.hethongtruongthpt;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class GenerateGradesSQL {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/hethongthpt?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true";
        String user = "root";
        String password = "LiChaengisreal1127@";

        String outputFile = "insert_grades.sql";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             PrintWriter writer = new PrintWriter(new FileWriter(outputFile))) {

            System.out.println("Connected to the database. Generating SQL script...");
            writer.println("SET autocommit = 0;");
            writer.println("SET foreign_key_checks = 0;");
            writer.println("DELETE FROM diem WHERE nam_hoc = '2025-2026';");

            String hsSql = "SELECT id, lop_id FROM hoc_sinh WHERE trang_thai = 1";
            PreparedStatement hsStmt = conn.prepareStatement(hsSql);
            ResultSet hsRs = hsStmt.executeQuery();

            String pcdSql = "SELECT id, mon_hoc_id, giao_vien_id FROM phan_cong_day WHERE lop_id = ? AND nam_hoc = '2025-2026' AND hoc_ky = ?";
            PreparedStatement pcdStmt = conn.prepareStatement(pcdSql);

            String monSql = "SELECT nhom_danh_gia FROM mon_hoc WHERE id = ?";
            PreparedStatement monStmt = conn.prepareStatement(monSql);

            Random rand = new Random();
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            String now = LocalDateTime.now().format(dtf);

            int count = 0;

            while (hsRs.next()) {
                int hsId = hsRs.getInt("id");
                int lopId = hsRs.getInt("lop_id");

                for (int hocKy = 1; hocKy <= 2; hocKy++) {
                    pcdStmt.setInt(1, lopId);
                    pcdStmt.setInt(2, hocKy);
                    ResultSet pcdRs = pcdStmt.executeQuery();

                    while (pcdRs.next()) {
                        int pcdId = pcdRs.getInt("id");
                        int monId = pcdRs.getInt("mon_hoc_id");
                        int gvId = pcdRs.getInt("giao_vien_id");

                        monStmt.setInt(1, monId);
                        ResultSet monRs = monStmt.executeQuery();
                        String nhomDanhGia = "DIEM_SO";
                        if (monRs.next()) {
                            nhomDanhGia = monRs.getString("nhom_danh_gia");
                        }
                        monRs.close();

                        // Generate 4 TX
                        for (int tx = 1; tx <= 4; tx++) {
                            writer.println(generateInsert(hsId, monId, pcdId, "TX", tx, hocKy, nhomDanhGia, gvId, now, rand));
                            count++;
                        }
                        // Generate 1 GK
                        writer.println(generateInsert(hsId, monId, pcdId, "GK", 0, hocKy, nhomDanhGia, gvId, now, rand));
                        count++;
                        // Generate 1 CK
                        writer.println(generateInsert(hsId, monId, pcdId, "CK", 0, hocKy, nhomDanhGia, gvId, now, rand));
                        count++;
                    }
                    pcdRs.close();
                }
            }
            
            writer.println("COMMIT;");
            writer.println("SET foreign_key_checks = 1;");
            writer.println("SET autocommit = 1;");

            System.out.println("Successfully generated " + count + " INSERT statements to " + outputFile);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String generateInsert(int hsId, int monId, int pcdId, String loaiDiem, int stt, int hocKy, String nhomDanhGia, int gvId, String now, Random rand) {
        String giaTri = "NULL";
        String nhanXet = "NULL";
        
        if ("NHAN_XET".equals(nhomDanhGia) || "DANH_GIA".equals(nhomDanhGia)) {
            // 90% DAT, 10% CHUA_DAT
            nhanXet = rand.nextDouble() > 0.1 ? "'DAT'" : "'CHUA_DAT'";
        } else {
            // Random from 5.0 to 10.0, skewed to Good/Excellent
            double score = 5.0 + (rand.nextDouble() * 5.0);
            if (rand.nextDouble() > 0.3) {
                // Skew higher
                score = 7.0 + (rand.nextDouble() * 3.0);
            }
            // Round to 1 decimal place
            score = Math.round(score * 10.0) / 10.0;
            if (score > 10.0) score = 10.0;
            giaTri = String.valueOf(score);
        }

        return String.format(
            "INSERT INTO diem (hoc_sinh_id, mon_hoc_id, phan_cong_day_id, loai_diem, so_thu_tu, hoc_ky, nam_hoc, gia_tri, nhan_xet, status, ngay_nhap, ngay_sua, nguoi_nhap, nguoi_sua, giao_vien_nhap_id, version) " +
            "VALUES (%d, %d, %d, '%s', %d, %d, '2025-2026', %s, %s, 'CONFIRMED', '%s', '%s', 'system', 'system', %d, 0);",
            hsId, monId, pcdId, loaiDiem, stt, hocKy, giaTri, nhanXet, now, now, gvId
        );
    }
}
