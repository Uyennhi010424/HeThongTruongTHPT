package com.hethongtruongthpt.config;

import java.util.List;
import java.util.Map;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseFixer {

    @Bean
    public CommandLineRunner fixDatabaseSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Sửa lại cột nguoi_tao_id cho phép NULL (do Hibernate ddl-auto update không tự đổi cột từ NOT NULL sang NULL)
                jdbcTemplate.execute("ALTER TABLE thong_bao MODIFY nguoi_tao_id INT NULL");
                System.out.println("[DatabaseFixer] Đã sửa cột thong_bao.nguoi_tao_id thành NULL thành công.");
            } catch (Exception e) {
                System.out.println("[DatabaseFixer] Không thể sửa cột thong_bao.nguoi_tao_id: " + e.getMessage());
            }

            try {
                // Sửa cột giao_vien_id trong thoi_khoa_bieu cho phép NULL 
                jdbcTemplate.execute("ALTER TABLE thoi_khoa_bieu MODIFY giao_vien_id INT NULL");
                System.out.println("[DatabaseFixer] Đã sửa cột thoi_khoa_bieu.giao_vien_id thành NULL thành công.");
            } catch (Exception e) {
                System.out.println("[DatabaseFixer] Không thể sửa cột thoi_khoa_bieu.giao_vien_id: " + e.getMessage());
            }

            try {
                // Điều chỉnh ngày học kỳ cho 2025-2026 theo đúng tuần 1 bắt đầu 08/09/2025
                // HK1: Bắt đầu 2025-09-08, Kết thúc 2026-01-11, Hạn nhập điểm 2025-12-24
                // HK2: Bắt đầu 2026-01-12, Kết thúc 2026-05-31, Hạn nhập điểm 2026-05-20
                jdbcTemplate.execute("UPDATE nam_hoc SET " +
                        "ngay_bat_dau_hk1 = '2025-09-08', " +
                        "ngay_ket_thuc_hk1 = '2026-01-11', " +
                        "deadline_nhap_diem_hk1 = '2025-12-24', " +
                        "ngay_bat_dau_hk2 = '2026-01-12', " +
                        "ngay_ket_thuc_hk2 = '2026-05-31', " +
                        "deadline_nhap_diem_hk2 = '2026-05-20' " +
                        "WHERE ten_nam_hoc = '2025-2026'");

                // Điều chỉnh ngày học kỳ cho năm học mới 2026-2027: Tuần 1 bắt đầu 07/09/2026
                // HK1: Bắt đầu 2026-09-07, Kết thúc 2027-01-10, Hạn nhập điểm 2026-12-24
                // HK2: Bắt đầu 2027-01-11, Kết thúc 2027-05-30, Hạn nhập điểm 2027-05-20
                jdbcTemplate.execute("UPDATE nam_hoc SET " +
                        "ngay_bat_dau_hk1 = '2026-09-07', " +
                        "ngay_ket_thuc_hk1 = '2027-01-10', " +
                        "deadline_nhap_diem_hk1 = '2026-12-24', " +
                        "ngay_bat_dau_hk2 = '2027-01-11', " +
                        "ngay_ket_thuc_hk2 = '2027-05-30', " +
                        "deadline_nhap_diem_hk2 = '2027-05-20' " +
                        "WHERE ten_nam_hoc = '2026-2027'");
                System.out.println("[DatabaseFixer] Đã điều chỉnh ngày học kỳ và hạn nhập điểm thành công cho cả hai năm học (bắt đầu 07/09).");
            } catch (Exception e) {
                System.out.println("[DatabaseFixer] Lỗi khi điều chỉnh ngày học kỳ: " + e.getMessage());
            }

            try {
                // Thêm đơn xin nghỉ mẫu cho lớp 10A4 nếu chưa có
                Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM don_xin_nghi d JOIN hoc_sinh h ON d.hoc_sinh_id = h.id JOIN lop l ON h.lop_id = l.id WHERE l.ten_lop = '10A4'",
                    Integer.class
                );
                if (count == null || count == 0) {
                    List<Map<String, Object>> students = jdbcTemplate.queryForList(
                        "SELECT h.id as hs_id, phs.phu_huynh_id as ph_id, h.ho_ten FROM hoc_sinh h " +
                        "JOIN lop l ON h.lop_id = l.id " +
                        "LEFT JOIN phu_huynh_hoc_sinh phs ON phs.hoc_sinh_id = h.id " +
                        "WHERE l.ten_lop = '10A4' LIMIT 5"
                    );
                    if (!students.isEmpty()) {
                        // 1. Chờ duyệt - Lý do ốm sốt
                        Map<String, Object> s1 = students.get(0);
                        jdbcTemplate.update(
                            "INSERT INTO don_xin_nghi (hoc_sinh_id, phu_huynh_id, ngay_bat_dau, ngay_ket_thuc, ly_do, trang_thai, phan_hoi_gv, created_at, updated_at) " +
                            "VALUES (?, ?, '2026-09-03', '2026-09-04', 'Em bị sốt xuất huyết cần nghỉ ngơi và theo dõi điều trị tại bệnh viện.', 'PENDING', NULL, NOW(), NOW())",
                            s1.get("hs_id"), s1.get("ph_id")
                        );

                        if (students.size() > 1) {
                            // 2. Chờ duyệt - Lý do việc gia đình
                            Map<String, Object> s2 = students.get(1);
                            jdbcTemplate.update(
                                "INSERT INTO don_xin_nghi (hoc_sinh_id, phu_huynh_id, ngay_bat_dau, ngay_ket_thuc, ly_do, trang_thai, phan_hoi_gv, created_at, updated_at) " +
                                "VALUES (?, ?, '2026-09-05', '2026-09-05', 'Gia đình có việc hiếu ở quê, xin phép thầy cho cháu nghỉ 1 ngày.', 'PENDING', NULL, NOW(), NOW())",
                                s2.get("hs_id"), s2.get("ph_id")
                            );
                        }

                        if (students.size() > 2) {
                            // 3. Đã duyệt - Lý do cảm sốt
                            Map<String, Object> s3 = students.get(2);
                            jdbcTemplate.update(
                                "INSERT INTO don_xin_nghi (hoc_sinh_id, phu_huynh_id, ngay_bat_dau, ngay_ket_thuc, ly_do, trang_thai, phan_hoi_gv, created_at, updated_at) " +
                                "VALUES (?, ?, '2026-08-25', '2026-08-26', 'Cháu bị cảm sốt virut bác sĩ chỉ định nghỉ học 2 ngày.', 'APPROVED', 'Đã duyệt. Chúc em sớm bình phục và nhớ mượn vở bạn ghi bài đầy đủ nhé.', NOW(), NOW())",
                                s3.get("hs_id"), s3.get("ph_id")
                            );
                        }

                        if (students.size() > 3) {
                            // 4. Từ chối - Lý do không chính đáng
                            Map<String, Object> s4 = students.get(3);
                            jdbcTemplate.update(
                                "INSERT INTO don_xin_nghi (hoc_sinh_id, phu_huynh_id, ngay_bat_dau, ngay_ket_thuc, ly_do, trang_thai, phan_hoi_gv, created_at, updated_at) " +
                                "VALUES (?, ?, '2026-08-20', '2026-08-22', 'Gia đình tổ chức đi du lịch.', 'REJECTED', 'Thời gian trùng với lịch thi khảo sát đầu năm của trường, phụ huynh vui lòng sắp xếp lại lịch.', NOW(), NOW())",
                                s4.get("hs_id"), s4.get("ph_id")
                            );
                        }

                        System.out.println("[DatabaseFixer] Đã thêm các đơn xin nghỉ mẫu cho lớp 10A4 thành công.");
                    }
                }
            } catch (Exception e) {
                System.out.println("[DatabaseFixer] Lỗi khi thêm đơn xin nghỉ mẫu: " + e.getMessage());
            }

            try {
                // Tự động kiểm tra và kết chuyển học sinh sang năm học 2026-2027 nếu các lớp 11, 12 của 2026-2027 chưa có học sinh
                Integer hsIn2026Khoi11And12 = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM hoc_sinh WHERE lop_id IN (26,27,28,29,30,31,32,33,34,35)",
                    Integer.class
                );
                if (hsIn2026Khoi11And12 == null || hsIn2026Khoi11And12 == 0) {
                    // Chuyển khối 10 (2025-2026) -> khối 11 (2026-2027)
                    jdbcTemplate.update("UPDATE hoc_sinh SET lop_id = 26 WHERE lop_id = 1");
                    jdbcTemplate.update("UPDATE hoc_sinh SET lop_id = 27 WHERE lop_id = 2");
                    jdbcTemplate.update("UPDATE hoc_sinh SET lop_id = 28 WHERE lop_id = 3");
                    jdbcTemplate.update("UPDATE hoc_sinh SET lop_id = 29 WHERE lop_id = 4");
                    jdbcTemplate.update("UPDATE hoc_sinh SET lop_id = 30 WHERE lop_id = 5");

                    // Chuyển khối 11 (2025-2026) -> khối 12 (2026-2027)
                    jdbcTemplate.update("UPDATE hoc_sinh SET lop_id = 31 WHERE lop_id = 6");
                    jdbcTemplate.update("UPDATE hoc_sinh SET lop_id = 32 WHERE lop_id = 7");
                    jdbcTemplate.update("UPDATE hoc_sinh SET lop_id = 33 WHERE lop_id = 8");
                    jdbcTemplate.update("UPDATE hoc_sinh SET lop_id = 34 WHERE lop_id = 9");
                    jdbcTemplate.update("UPDATE hoc_sinh SET lop_id = 35 WHERE lop_id = 10");

                    // Tốt nghiệp khối 12 (2025-2026)
                    jdbcTemplate.update("UPDATE hoc_sinh SET lop_id = NULL, trang_thai = 2 WHERE lop_id IN (11,12,13,14,15)");

                    // Cập nhật sĩ số lớp
                    jdbcTemplate.update("UPDATE lop SET si_so = (SELECT COUNT(*) FROM hoc_sinh WHERE hoc_sinh.lop_id = lop.id)");
                    System.out.println("[DatabaseFixer] Đã tự động đồng bộ học sinh vào các lớp năm học 2026-2027 thành công.");
                }
            } catch (Exception e) {
                System.out.println("[DatabaseFixer] Lỗi khi đồng bộ học sinh năm 2026-2027: " + e.getMessage());
            }
        };
    }
}

