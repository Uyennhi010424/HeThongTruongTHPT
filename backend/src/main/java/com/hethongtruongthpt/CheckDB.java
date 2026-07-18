package com.hethongtruongthpt;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckDB {
    public static void main(String[] args) {
        try {
            String url = "jdbc:mysql://localhost:3306/hethongthpt?serverTimezone=Asia/Ho_Chi_Minh";
            Connection conn = DriverManager.getConnection(url, "root", "LiChaengisreal1127@");
            Statement stmt = conn.createStatement();
            
            System.out.println("=== KET QUA KIEM TRA DATABASE ===");
            ResultSet rs = stmt.executeQuery(
                "SELECT id, ho_ten, bo_mon FROM giao_vien " +
                "WHERE id NOT IN (SELECT giao_vien_id FROM phan_cong_day)"
            );
            
            System.out.println("Danh sach Giao Vien khong co trong bang phan_cong_day:");
            while(rs.next()) {
                System.out.println("ID: " + rs.getInt("id") + 
                                   " | Ten: " + rs.getString("ho_ten") + 
                                   " | Bo Mon: [" + rs.getString("bo_mon") + "]");
            }

            System.out.println("=================================");
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
