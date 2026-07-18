import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../api/authApi";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Token xác thực đổi mật khẩu không hợp lệ hoặc thiếu.");
      return;
    }

    const p = password.trim();
    const cp = confirmPassword.trim();

    if (!p || !cp) {
      setError("Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.");
      return;
    }

    if (p.length < 6) {
      setError("Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.");
      return;
    }

    if (p !== cp) {
      setError("Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, p);
      setSuccess("Đặt lại mật khẩu thành công! Bạn sẽ được tự động chuyển hướng về trang Đăng nhập sau 3 giây.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error;
      setError(msg || "Không thể đặt lại mật khẩu. Có thể đường link đã hết hạn hoặc không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at 10% 20%, #f1f7ff 0%, #e6f0ff 90%)",
      padding: 16
    }}>
      <div style={{
        background: "#fff",
        padding: "32px 28px",
        borderRadius: "20px",
        boxShadow: "0 10px 30px rgba(30, 58, 138, 0.08)",
        width: "100%",
        maxWidth: 420
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 44, color: "var(--navy-900)" }}>lock_reset</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "10px 0 6px 0", color: "var(--navy-900)" }}>Đặt lại mật khẩu</h2>
          <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Mật khẩu mới</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  paddingRight: 40,
                  borderRadius: "8px",
                  border: "1px solid var(--stroke)",
                  outline: "none"
                }}
                disabled={loading || !!success}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#666",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Xác nhận mật khẩu mới</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--stroke)",
                outline: "none"
              }}
              disabled={loading || !!success}
              required
            />
          </div>

          {error && <div style={{ fontSize: 13, color: "#dc2626", background: "#fef2f2", padding: "10px 12px", borderRadius: "8px" }}>{error}</div>}
          {success && <div style={{ fontSize: 13, color: "#16a34a", background: "#f0fdf4", padding: "10px 12px", borderRadius: "8px" }}>{success}</div>}

          <button
            type="submit"
            disabled={loading || !!success}
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "var(--navy-900)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              marginTop: 8,
              transition: "opacity 0.2s"
            }}
          >
            {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
