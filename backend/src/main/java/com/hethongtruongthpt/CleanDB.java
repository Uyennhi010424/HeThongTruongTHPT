import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class CleanDB {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/hethongthpt?serverTimezone=Asia/Ho_Chi_Minh";
        String user = "root";
        String pass = "LiChaengisreal1127@";

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {
            stmt.execute("SET FOREIGN_KEY_CHECKS = 0");
            stmt.execute("TRUNCATE TABLE thong_bao");
            stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
            System.out.println("Truncated thong_bao successfully.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
