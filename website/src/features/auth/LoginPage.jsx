import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/authApi";
import { setAuth } from "../../store/authStore";

export default function LoginPage({ title = "Đăng nhập", expectedRole = "" }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState(expectedRole || "ADMIN");
  const navigate = useNavigate();

  const roleRoutes = useMemo(
    () => ({
      ADMIN: "/admin/dashboard",
      GIAOVIEN: "/teacher/dashboard",
      HOCSINH: "/student/home",
      PHUHUYNH: "/parent/home",
      VAN_THU: "/admin/dashboard"
    }),
    []
  );

  const loginRoutes = useMemo(
    () => ({
      ADMIN: "/login/admin",
      GIAOVIEN: "/login/teacher",
      HOCSINH: "/login/student",
      PHUHUYNH: "/login/parent",
      VAN_THU: "/login/admin"
    }),
    []
  );

  useEffect(() => {
    if (expectedRole) {
      setSelectedRole(expectedRole);
    }
  }, [expectedRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login({ username, password });
      const token = res?.data?.data?.token || "";
      const role = res?.data?.data?.role || "";
      if (!token || !role) {
        setError("Tài khoản chưa được phân quyền.");
        return;
      }
      if (expectedRole && role !== expectedRole) {
        setError("Bạn đang đăng nhập sai vai trò.");
        return;
      }
      setAuth(token, role);
      window.location.href = roleRoutes[role] || "/login";
    } catch (err) {
      setError("Đăng nhập thất bại");
    }
  };

  return (
    <div className="page login-page">
      <div className="card login-card">
        <div className="login-header">
          <div className="login-badge">HT</div>
          <div>
            <h2>{title}</h2>
            <div className="login-subtitle">Hệ thống quản lý trường THPT</div>
          </div>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Vai trò</span>
            <select
              value={selectedRole}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedRole(value);
                const next = loginRoutes[value] || "/login";
                navigate(next);
              }}
            >
              <option value="ADMIN">Quản trị</option>
              <option value="GIAOVIEN">Giáo viên</option>
              <option value="HOCSINH">Học sinh</option>
              <option value="PHUHUYNH">Phụ huynh</option>
            </select>
          </label>
          <label className="form-field">
            <span>Tài khoản</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="vd: admin"
            />
          </label>
          <label className="form-field">
            <span>Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn-primary" type="submit">
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}