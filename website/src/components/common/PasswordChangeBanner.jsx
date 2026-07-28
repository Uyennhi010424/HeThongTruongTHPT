import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TriangleAlert, X } from "lucide-react";

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
    <div className="mx-4 mt-4 bg-[#FEF3C7] border-l-4 border-amber-500 rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 text-sm shadow-sm transition-all duration-300">
      <div className="flex items-center gap-2.5 text-amber-900">
        <TriangleAlert size={18} className="text-amber-600 shrink-0" />
        <span className="font-medium">
          Bạn đang sử dụng mật khẩu mặc định.{" "}
          <button
            type="button"
            className="text-blue-600 font-bold hover:underline underline-offset-2 hover:text-blue-700 transition-colors"
            onClick={() => navigate(changePath)}
          >
            Đổi mật khẩu ngay
          </button>{" "}
          để tăng cường bảo mật tài khoản.
        </span>
      </div>
      <button
        type="button"
        className="text-amber-600 hover:text-amber-900 hover:bg-amber-100 p-1 rounded-md transition-colors shrink-0"
        onClick={handleDismiss}
        aria-label="Đóng"
      >
        <X size={16} />
      </button>
    </div>
  );
}
