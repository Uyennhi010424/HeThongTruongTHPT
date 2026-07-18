import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { login, forgotPassword } from "../../api/authApi";
import { setAuth } from "../../store/authStore";
import Captcha from "../../components/common/Captcha.jsx";

const roleRoutes = {
  ADMIN: "/admin/dashboard",
  GIAOVIEN: "/teacher/dashboard",
  HOCSINH: "/student/home",
  PHUHUYNH: "/parent/home",
  VAN_THU: "/admin/dashboard"
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // CAPTCHA state
  const [captchaText, setCaptchaText] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaAttempts, setCaptchaAttempts] = useState(0);
  const [captchaLocked, setCaptchaLocked] = useState(false);
  const [captchaLockCountdown, setCaptchaLockCountdown] = useState(0);

  // Password lock state
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  const [passwordLocked, setPasswordLocked] = useState(false);
  const [passwordLockCountdown, setPasswordLockCountdown] = useState(0);

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  const handleCaptchaGenerate = useCallback((text) => {
    setCaptchaText(text);
    setCaptchaInput("");
    setCaptchaError("");
  }, []);

  // CAPTCHA lock countdown
  const startCaptchaLock = useCallback(() => {
    setCaptchaLocked(true);
    setCaptchaLockCountdown(30);
    const timer = setInterval(() => {
      setCaptchaLockCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCaptchaLocked(false);
          setCaptchaAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Password lock countdown
  const startPasswordLock = useCallback(() => {
    setPasswordLocked(true);
    setPasswordLockCountdown(15 * 60);
    const timer = setInterval(() => {
      setPasswordLockCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPasswordLocked(false);
          setPasswordAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}p${s.toString().padStart(2, "0")}s` : `${s}s`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCaptchaError("");

    const u = username.trim();
    const p = password.trim();

    if (!u || !p) {
      setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }

    // Check password lock
    if (passwordLocked) {
      setError(`Tài khoản bị khóa. Thử lại sau ${formatCountdown(passwordLockCountdown)}.`);
      return;
    }

    // Check captcha lock
    if (captchaLocked) {
      setCaptchaError(`Khóa CAPTCHA. Thử lại sau ${formatCountdown(captchaLockCountdown)}.`);
      return;
    }

    // Validate CAPTCHA
    if (!captchaInput.trim()) {
      setCaptchaError("Vui lòng nhập mã CAPTCHA.");
      return;
    }
    if (captchaInput !== captchaText) {
      const newAttempts = captchaAttempts + 1;
      setCaptchaAttempts(newAttempts);
      if (newAttempts >= 3) {
        startCaptchaLock();
        setCaptchaError("Sai CAPTCHA 3 lần. Khóa 30 giây.");
      } else {
        setCaptchaError(`Sai CAPTCHA. Còn ${3 - newAttempts} lần thử.`);
      }
      setCaptchaInput("");
      return;
    }

    setLoading(true);
    try {
      const res = await login({ username: u, password: p });
      const data = res?.data?.data || {};
      const token = data.token || "";
      const refreshToken = data.refreshToken || "";
      const role = data.role || "";

      if (!token || !role) {
        setError("Tài khoản chưa được phân quyền.");
        setLoading(false);
        return;
      }

      const normalize = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const normalizedRole = normalize(role);
      setAuth(token, normalizedRole, refreshToken);

      if (data.mustChangePassword) {
        sessionStorage.setItem("httt_must_change", "1");
        sessionStorage.removeItem("httt_must_change_dismissed");
      } else {
        sessionStorage.removeItem("httt_must_change");
        sessionStorage.removeItem("httt_must_change_dismissed");
      }

      const findRoute = (map, r) => map[r] || map[r.replace(/_/g, "")] || map[r.replace(/[^A-Z0-9]/g, "")];
      const target = findRoute(roleRoutes, normalizedRole);
      if (target) {
        window.location.href = target;
      } else {
        setError("Tài khoản chưa được phân quyền hợp lệ.");
      }
    } catch (err) {
      const newAttempts = passwordAttempts + 1;
      setPasswordAttempts(newAttempts);

      if (newAttempts >= 5) {
        startPasswordLock();
        setError("Sai mật khẩu 5 lần. Khóa tài khoản 15 phút.");
      } else {
        const msg = err?.response?.data?.message || err?.response?.data?.error;
        setError(msg || `Đăng nhập thất bại. Còn ${5 - newAttempts} lần thử.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-header">
          <div className="login-logo">
            <span className="material-symbols-outlined">school</span>
          </div>
          <h1 className="login-card-title">TRƯỜNG THPT ABC</h1>
          <p className="login-card-desc">Hệ thống Quản lý Điểm Học sinh</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-user">Tên đăng nhập</label>
            <input
              id="login-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              autoComplete="username"
              autoFocus
              disabled={passwordLocked}
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-pass">Mật khẩu</label>
            <div className="login-pass-wrap">
              <input
                id="login-pass"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                disabled={passwordLocked}
              />
              <button
                type="button"
                className="login-pass-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <div className="login-field">
            <label>Xác nhận</label>
            <Captcha
              onGenerate={handleCaptchaGenerate}
              disabled={captchaLocked || passwordLocked}
            />
            <input
              type="text"
              className="captcha-input"
              value={captchaInput}
              onChange={(e) => {
                setCaptchaInput(e.target.value.slice(0, 4));
                setCaptchaError("");
              }}
              placeholder="Phân biệt chữ hoa/thường"
              maxLength={4}
              autoComplete="off"
              disabled={captchaLocked || passwordLocked}
            />
            {captchaError && <div className="login-error captcha-error-inline">{captchaError}</div>}
          </div>

          {error && <div className="login-error">{error}</div>}

          {passwordLocked && passwordLockCountdown > 0 && (
            <div className="login-error" style={{ textAlign: "center" }}>
              Tài khoản bị khóa {formatCountdown(passwordLockCountdown)}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading || captchaLocked || passwordLocked}
          >
            {loading
              ? "Đang đăng nhập..."
              : captchaLocked
                ? `Khóa CAPTCHA ${formatCountdown(captchaLockCountdown)}`
                : passwordLocked
                  ? `Khóa tài khoản ${formatCountdown(passwordLockCountdown)}`
                  : "ĐĂNG NHẬP"}
          </button>

          <p className="login-hint">
            <button
              type="button"
              className="login-forgot-btn"
              onClick={() => {
                setForgotUsername(username.trim());
                setForgotMessage("");
                setForgotModalOpen(true);
              }}
            >
              Quên mật khẩu?
            </button>
          </p>
        </form>

        <p className="login-footer-text">
          © {new Date().getFullYear()} Hệ thống Quản lý Điểm Học sinh THPT
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <ForgotPasswordModal
          onClose={() => setForgotModalOpen(false)}
          username={forgotUsername}
          setUsername={setForgotUsername}
        />
      )}
    </div>
  );
}

function ForgotPasswordModal({ onClose, username, setUsername }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Vui lòng nhập tên đăng nhập.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(username.trim());
      setSuccess("Hệ thống đã gửi link đổi mật khẩu đến email đăng ký của bạn. Vui lòng kiểm tra hòm thư (bao gồm cả thư rác / spam).");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error;
      setError(msg || "Không thể gửi yêu cầu cấp lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()} style={{ width: 440 }}>
        <div className="login-modal-header">
          <h3 style={{ fontWeight: 700 }}>Cấp lại mật khẩu</h3>
          <button type="button" className="login-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSend}>
          <div className="login-modal-body">
            <p className="login-modal-desc" style={{ marginBottom: 16 }}>
              Nhập tên đăng nhập để hệ thống gửi đường link xác thực đổi mật khẩu mới qua Email đã liên kết.
            </p>
            <div className="login-field" style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập của bạn"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--stroke)",
                  marginTop: 6,
                  outline: "none"
                }}
                required
              />
            </div>
            {error && <div className="login-error" style={{ marginTop: 8 }}>{error}</div>}
            {success && <div className="table-success" style={{ marginTop: 8, fontSize: 13, color: "#16a34a", background: "#f0fdf4", padding: 10, borderRadius: 8 }}>{success}</div>}
          </div>
          <div className="login-modal-footer" style={{ display: "flex", gap: 10, justifySelf: "end", padding: "12px 16px" }}>
            <button type="button" className="btn-outline btn-sm" onClick={onClose}>
              Đóng
            </button>
            <button type="submit" className="btn-primary btn-sm" disabled={loading} style={{ background: "var(--navy-900)", color: "#fff" }}>
              {loading ? "Đang gửi..." : "Gửi Email xác thực"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
