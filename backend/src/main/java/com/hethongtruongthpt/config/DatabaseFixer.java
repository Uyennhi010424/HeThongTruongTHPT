package com.hethongtruongthpt.config;

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
                // Điều chỉnh ngày học kỳ cho 2025-2026 theo đúng hình ảnh
                // HK1: Bắt đầu 2025-09-01, Kết thúc 2026-01-04, Hạn nhập điểm 2025-12-24
                // HK2: Bắt đầu 2026-01-05, Kết thúc 2026-05-31, Hạn nhập điểm 2026-05-20
                jdbcTemplate.execute("UPDATE nam_hoc SET " +
                        "ngay_bat_dau_hk1 = '2025-09-01', " +
                        "ngay_ket_thuc_hk1 = '2026-01-04', " +
                        "deadline_nhap_diem_hk1 = '2025-12-24', " +
                        "ngay_bat_dau_hk2 = '2026-01-05', " +
                        "ngay_ket_thuc_hk2 = '2026-05-31', " +
                        "deadline_nhap_diem_hk2 = '2026-05-20' " +
                        "WHERE ten_nam_hoc = '2025-2026'");

                // Điều chỉnh ngày học kỳ cho năm học mới 2026-2027 tương ứng
                // HK1: Bắt đầu 2026-08-31, Kết thúc 2027-01-03, Hạn nhập điểm 2026-12-24
                // HK2: Bắt đầu 2027-01-04, Kết thúc 2027-05-30, Hạn nhập điểm 2027-05-20
                jdbcTemplate.execute("UPDATE nam_hoc SET " +
                        "ngay_bat_dau_hk1 = '2026-08-31', " +
                        "ngay_ket_thuc_hk1 = '2027-01-03', " +
                        "deadline_nhap_diem_hk1 = '2026-12-24', " +
                        "ngay_bat_dau_hk2 = '2027-01-04', " +
                        "ngay_ket_thuc_hk2 = '2027-05-30', " +
                        "deadline_nhap_diem_hk2 = '2027-05-20' " +
                        "WHERE ten_nam_hoc = '2026-2027'");
                System.out.println("[DatabaseFixer] Đã điều chỉnh ngày học kỳ và hạn nhập điểm thành công cho cả hai năm học.");
            } catch (Exception e) {
                System.out.println("[DatabaseFixer] Lỗi khi điều chỉnh ngày học kỳ: " + e.getMessage());
            }
        };
    }
}
