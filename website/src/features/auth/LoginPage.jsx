import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/authApi";
import { setAuth } from "../../store/authStore";
import MaterialIcon from "../../components/edu/MaterialIcon.jsx";

export default function LoginPage({ title = "Đăng nhập", expectedRole = "" }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState(expectedRole || "ADMIN");
  const navigate = useNavigate();

  const roleRoutes = useMemo(
    () => ({
      ADMIN: "/admin/dashboard",
      GIAO_VIEN: "/teacher/dashboard",
      HOC_SINH: "/student/home",
      PHU_HUYNH: "/parent/home",
      VAN_THU: "/admin/dashboard"
    }),
    []
  );

  const loginRoutes = useMemo(
    () => ({
      ADMIN: "/login/admin",
      GIAO_VIEN: "/login/teacher",
      HOC_SINH: "/login/student",
      PHU_HUYNH: "/login/parent",
      VAN_THU: "/login/admin"
    }),
    []
  );

  useEffect(() => {
    if (expectedRole) setSelectedRole(expectedRole);
  }, [expectedRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();
    if (!normalizedUsername || !normalizedPassword) {
      setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }
    try {
      const res = await login({
        username: normalizedUsername,
        password: normalizedPassword
      });
      const token = res?.data?.data?.token || "";
      const role = res?.data?.data?.role || "";
      if (!token || !role) {
        setError("Tài khoản chưa được phân quyền.");
        return;
      }
      const normalize = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (expectedRole && normalize(role) !== normalize(expectedRole)) {
        setError("Bạn đang đăng nhập sai vai trò.");
        return;
      }
      setAuth(token, role);
      const findRoute = (map, r) => map[r] || map[r.replace(/_/g, "")] || map[r.replace(/[^A-Z0-9]/g, "")];
      window.location.href = findRoute(roleRoutes, role) || "/login";
    } catch (err) {
      console.log("=== LOGIN ERROR ===", err);
    console.log("status:", err?.response?.status);
    console.log("response data:", err?.response?.data);
    const backendMessage = err?.response?.data?.message || err?.response?.data?.error;
    setError(backendMessage || "Đăng nhập thất bại");
      // const backendMessage = err?.response?.data?.message || err?.response?.data?.error;
      // setError(backendMessage || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0_18px_40px_rgba(11,28,48,0.12)]">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-on-primary">
            <MaterialIcon name="school" className="text-2xl" />
          </div>
          <div>
            <h1 className="text-headline-md font-bold text-primary">EduManager Pro</h1>
            <p className="text-label-sm text-on-surface-variant">{title}</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block font-label-md text-on-surface-variant">Vai trò</label>
            <select
              value={selectedRole}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedRole(value);
                navigate(loginRoutes[value] || "/login");
              }}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 font-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            >
              <option value="ADMIN">Quản trị</option>
              <option value="GIAO_VIEN">Giáo viên</option>
              <option value="HOC_SINH">Học sinh</option>
              <option value="PHU_HUYNH">Phụ huynh</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-label-md text-on-surface-variant">Tài khoản</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="vd: admin"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 font-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>
          <div>
            <label className="mb-1 block font-label-md text-on-surface-variant">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 font-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-error-container px-3 py-2 text-body-sm text-on-error-container">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-label-md text-on-primary shadow-md transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <MaterialIcon name="login" />
            Đăng nhập
          </button>
        </form>
        <p className="mt-6 text-center text-label-sm text-outline">
          Hệ thống quản lý giáo dục THPT
        </p>
      </div>
    </div>
  );
}
