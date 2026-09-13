import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../api/authApi";
import { PASSWORD_RULES, validatePassword, getPasswordStrength } from "../../utils/passwordPolicy.js";

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

  const strength = useMemo(() => getPasswordStrength(password), [password]);

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

    const validationError = validatePassword(p);
    if (validationError) {
      setError(validationError);
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
        maxWidth: 440
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 44, color: "var(--navy-900)" }}>lock_reset</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "10px 0 6px 0", color: "var(--navy-900)" }}>Đặt lại mật khẩu</h2>
          <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Vui lòng thiết lập mật khẩu mới đáp ứng tiêu chuẩn an toàn</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Mật khẩu mới</label>
              {password && (
                <span className={`text-xs font-bold ${strength.textColor}`}>
                  Độ mạnh: {strength.label}
                </span>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  paddingRight: 40,
                  borderRadius: "8px",
                  border: "1px solid var(--stroke)",
                  outline: "none",
                  fontSize: 14
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

            {/* Strength Meter Bar */}
            {password && (
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            )}

            {/* Checklist of Password Rules */}
            <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
              <div className="text-xs font-bold text-slate-600 mb-1">Quy chuẩn mật khẩu:</div>
              <div className="grid grid-cols-1 gap-1">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        passed ? "text-emerald-700 font-semibold" : "text-slate-500"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {passed ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
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
                outline: "none",
                fontSize: 14
              }}
              disabled={loading || !!success}
              required
            />
            {confirmPassword && password && confirmPassword !== password && (
              <p className="text-xs text-red-500 font-medium">Mật khẩu xác nhận chưa khớp.</p>
            )}
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
