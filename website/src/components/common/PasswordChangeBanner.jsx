import { useState } from "react";
import { useNavigate } from "react-router-dom";

const changePasswordPaths = {
  ADMIN: "/admin/profile/change-password",
  GIAOVIEN: "/teacher/profile/change-password",
  HOCSINH: "/student/profile/change-password",
  PHUHUYNH: "/parent/profile/change-password",
};

export default function PasswordChangeBanner() {
  const navigate = useNavigate();
  const mustChange = sessionStorage.getItem("httt_must_change") === "1";
  const dismissed = sessionStorage.getItem("httt_must_change_dismissed") === "1";
  const [hidden, setHidden] = useState(dismissed);

  if (!mustChange || hidden) return null;

  const role = (sessionStorage.getItem("httt_role") || "").toUpperCase();
  const changePath = changePasswordPaths[role] || "/login";

  const handleDismiss = () => {
    sessionStorage.setItem("httt_must_change_dismissed", "1");
    setHidden(true);
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-amber-800">
        <span className="material-symbols-outlined text-amber-600" style={{ fontSize: 20 }}>
          warning
        </span>
        <span>
          Bạn đang sử dụng mật khẩu mặc định.{" "}
          <button
            type="button"
            className="text-amber-900 font-semibold underline underline-offset-2 hover:text-amber-700"
            onClick={() => navigate(changePath)}
          >
            Đổi mật khẩu
          </button>{" "}
          để bảo mật tài khoản.
        </span>
      </div>
      <button
        type="button"
        className="text-amber-600 hover:text-amber-800 shrink-0"
        onClick={handleDismiss}
        aria-label="Đóng"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          close
        </span>
      </button>
    </div>
  );
}
