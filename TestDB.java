import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class TestDB {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/hethongthpt", "root", "LiChaengisreal1127@");
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT id, ma_hoc_sinh FROM hoc_sinh WHERE id = 760");
            if (rs.next()) {
                System.out.println("ID: " + rs.getInt("id") + ", MA_HOC_SINH: " + rs.getString("ma_hoc_sinh"));
            } else {
                System.out.println("Student 760 not found.");
            }
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
