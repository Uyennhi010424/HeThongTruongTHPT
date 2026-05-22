import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MaterialIcon from "./MaterialIcon.jsx";
import { clearAuth } from "../../store/authStore.js";

export default function EduTopBar({
  searchPlaceholder = "Tìm kiếm...",
  userName = "Quản trị viên",
  userRole = "Admin",
  onToggle,
  isOpen = false
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/login/admin", { replace: true });
  };

  return (
    <header className="fixed left-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-md shadow-sm lg:left-[280px] lg:w-[calc(100%-280px)] lg:px-lg">
      <div className="flex items-center gap-sm">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface transition-all hover:bg-surface-container-low lg:hidden"
          aria-label="Mở menu"
          aria-controls="admin-sidebar"
          aria-expanded={isOpen}
          onClick={onToggle}
        >
          <MaterialIcon name="menu" className="text-primary" />
        </button>
        <div className="relative hidden w-[min(36rem,40vw)] lg:block">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 font-body-sm text-body-sm focus:ring-2 focus:ring-secondary"
          />
        </div>
      </div>
      <div className="hidden items-center gap-md lg:flex">
        <button
          type="button"
          className="rounded-full p-2 transition-all hover:bg-surface-container-low"
          aria-label="Thông báo"
        >
          <MaterialIcon name="notifications" className="text-primary" />
        </button>
        <div className="relative flex items-center gap-2 border-l border-outline-variant pl-3" ref={accountRef}>
          <div className="hidden text-right leading-tight sm:block">
            <p className="font-label-md text-label-md leading-tight text-on-surface">{userName}</p>
            <p className="font-label-sm text-label-sm leading-tight text-on-surface-variant">{userRole}</p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary"
            aria-label="Tài khoản"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((current) => !current)}
          >
            <MaterialIcon name="account_circle" />
          </button>
          {accountOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-outline-variant bg-surface p-2 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
              <div className="rounded-xl bg-surface-container-low px-4 py-3">
                <p className="font-label-md text-label-md text-on-surface">{userName}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{userRole}</p>
              </div>

              <div className="mt-2 space-y-1">
                {[
                  { label: "Thông tin cá nhân", icon: "person" },
                  { label: "Chỉnh sửa hồ sơ", icon: "edit" },
                  { label: "Đổi mật khẩu", icon: "lock" },
                  { label: "Cài đặt", icon: "settings" }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
                    onClick={() => setAccountOpen(false)}
                  >
                    <MaterialIcon name={item.icon} className="text-primary" />
                    <span>{item.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-label-md text-label-md text-error transition-colors hover:bg-error-container/40"
                  onClick={handleLogout}
                >
                  <MaterialIcon name="logout" className="text-error" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
