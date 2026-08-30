import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { login, forgotPassword } from "../../api/authApi";
import { setAuth } from "../../store/authStore";
import Captcha from "../../components/common/Captcha.jsx";
import { Lock, User, Eye, EyeOff, School } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";

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

  const { themeLogo, themeFooter } = useTheme();

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
      const res = await login({ username: u, password: p, device: "web" });
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
    <div className="h-screen w-full flex flex-col md:flex-row font-sans bg-white overflow-hidden">

      {/* Left Side - Banner (60%) */}
      <div className="hidden md:flex md:w-[60%] relative flex-col justify-center overflow-hidden bg-[#1E40AF] h-full">
        {/* Background Image without blur */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/login-bg.jpg')" }}
          ></div>
        </div>

        {/* Subtle blue overlay to ensure clarity without muddying the image */}
        <div className="absolute inset-0 bg-[#0B2A6F]/20 mix-blend-multiply"></div>

        <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');`}
        </style>

        {/* Content inside Beautiful Glass Panel */}
        <div className="relative z-10 ml-[10%] w-full max-w-[80%]">
          <div
            className="rounded-[28px] shadow-2xl border border-white/10"
            style={{
              backgroundColor: "rgba(17, 24, 39, 0.55)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              padding: "40px"
            }}
          >
            <div className="mb-8">
              <img src={themeLogo} alt="Logo" className="h-32 w-auto object-contain brightness-0 invert drop-shadow-md opacity-90" />
            </div>
            <h2
              className="text-sm font-bold tracking-[0.2em] text-gray-300 uppercase mb-4"
              style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
              HỆ THỐNG QUẢN LÝ
            </h2>
            <h1
              className="text-4xl lg:text-5xl font-bold leading-[1.2] text-white mb-5 tracking-tight drop-shadow-lg whitespace-nowrap"
              style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
              Điểm học sinh THPT
            </h1>
            <p
              className="text-gray-200 text-lg font-medium leading-relaxed"
              style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
              Nền tảng quản lý giáo dục hiện đại.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form (40%) */}
      <div className="w-full md:w-[40%] flex items-center justify-center px-8 sm:px-12 lg:px-16 bg-white relative z-10 h-full">
        <div className="w-full max-w-[420px] py-4">

          {/* Header */}
          <div className="mb-6 text-center">
            <img src={themeLogo} alt="Logo Edu Manager" className="h-32 w-auto object-contain mx-auto mb-4" />
            <h2 className="text-[28px] font-bold text-gray-900 mb-1 tracking-tight">Đăng nhập hệ thống</h2>
            <p className="text-gray-500 text-[15px]">Vui lòng đăng nhập để tiếp tục.</p>
          </div>

          <hr className="border-gray-100 mb-6" />

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="login-user" className="block text-sm font-semibold text-gray-700">
                Email đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="login-user"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập email"
                  autoComplete="username"
                  autoFocus
                  disabled={passwordLocked}
                  className="block w-full pl-11 pr-4 h-[52px] bg-white border border-gray-200 hover:border-gray-300 rounded-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#3B82F6]/20 focus:border-[#2563EB] transition-all disabled:opacity-50 disabled:bg-gray-50 text-base"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-pass" className="block text-sm font-semibold text-gray-700">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="login-pass"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  disabled={passwordLocked}
                  className="block w-full pl-11 pr-12 h-[52px] bg-white border border-gray-200 hover:border-gray-300 rounded-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#3B82F6]/20 focus:border-[#2563EB] transition-all disabled:opacity-50 disabled:bg-gray-50 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Captcha */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Mã xác thực</label>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value.slice(0, 4));
                    setCaptchaError("");
                  }}
                  placeholder="CAPTCHA"
                  maxLength={4}
                  autoComplete="off"
                  disabled={captchaLocked || passwordLocked}
                  className="block w-full sm:w-1/2 px-4 h-[52px] bg-white border border-gray-200 hover:border-gray-300 rounded-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#3B82F6]/20 focus:border-[#2563EB] transition-all disabled:opacity-50 text-base text-center tracking-widest font-semibold"
                />
                <div className="w-full sm:w-1/2 h-[52px]">
                  <Captcha
                    onGenerate={handleCaptchaGenerate}
                    disabled={captchaLocked || passwordLocked}
                  />
                </div>
              </div>
              {captchaError && <p className="text-red-500 text-sm mt-1 font-medium">{captchaError}</p>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#1D4ED8] focus:ring-[#3B82F6] border-gray-300 rounded cursor-pointer transition-colors"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer select-none">
                  Ghi nhớ
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForgotUsername(username.trim());
                  setForgotMessage("");
                  setForgotModalOpen(true);
                }}
                className="text-sm font-semibold text-[#1D4ED8] hover:text-[#1e3a8a] transition-colors focus:outline-none"
              >

              </button>
            </div>

            {/* Errors & Locks */}
            {error && <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">{error}</div>}

            {passwordLocked && passwordLockCountdown > 0 && (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium text-center">
                Khóa {formatCountdown(passwordLockCountdown)}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || captchaLocked || passwordLocked}
                className="w-full h-[52px] flex justify-center items-center px-4 border border-transparent rounded-[14px] shadow-md text-base font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1e3a8a] focus:outline-none focus:ring-4 focus:ring-[#3B82F6]/30 transition-all duration-300 ease-out disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg"
              >
                {loading
                  ? "Đang xử lý..."
                  : captchaLocked
                    ? `Khóa CAPTCHA ${formatCountdown(captchaLockCountdown)}`
                    : passwordLocked
                      ? `Khóa ${formatCountdown(passwordLockCountdown)}`
                      : "Đăng nhập"}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm font-medium text-gray-400">
            {themeFooter}
          </div>
        </div>
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
      setSuccess("Hệ thống đã gửi link đổi mật khẩu đến email đăng ký của bạn. Vui lòng kiểm tra hòm thư (bao gồm cả thư rác).");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error;
      setError(msg || "Không thể gửi yêu cầu cấp lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Cấp lại mật khẩu</h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full p-1 transition-colors"
            onClick={onClose}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSend}>
          <div className="px-6 py-5">
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Nhập tên đăng nhập để hệ thống gửi đường link xác thực đổi mật khẩu mới qua Email đã liên kết.
            </p>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập của bạn"
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
                required
              />
            </div>

            {error && <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium">{error}</div>}
            {success && <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg text-green-700 text-sm font-medium">{success}</div>}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center min-w-[140px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Gửi Email xác thực"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
