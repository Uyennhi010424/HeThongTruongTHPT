import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearAuth, getRole } from "../../../store/authStore.js";
import { getCurrentUsernameFromToken } from "../../../utils/teacherProfile.js";
import { readCachedAvatar } from "../../../utils/avatarCache.js";
import { formatDate } from "../../../utils/helpers.js";
import SearchBar from "./SearchBar.jsx";
import NotificationBell from "../../common/NotificationBell.jsx";

export default function AdminHeader({
  userName = "Quản trị viên",
  userRole = "Admin",
  onToggle,
  isOpen = false,
  sidebarWidth,
  basePath = "/admin"
}) {
  const currentUsername = getCurrentUsernameFromToken();
  const currentRole = getRole();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const [avatar, setAvatar] = useState(() =>
    readCachedAvatar({ username: currentUsername, role: currentRole })
  );
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const onAvatarChanged = (e) => {
      const detail = e?.detail;
      if (typeof detail === "string") {
        setAvatar(detail || readCachedAvatar({ username: currentUsername, role: currentRole }));
        return;
      }
      setAvatar(readCachedAvatar({ username: currentUsername, role: currentRole }));
    };

    setAvatar(readCachedAvatar({ username: currentUsername, role: currentRole }));
    window.addEventListener("httt_avatar_changed", onAvatarChanged);
    
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setAccountOpen(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("httt_avatar_changed", onAvatarChanged);
    };
  }, [currentUsername, currentRole]);


  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const dynamicStyle = sidebarWidth !== undefined ? {
    left: window.innerWidth >= 1024 ? sidebarWidth : 0,
    width: window.innerWidth >= 1024 ? `calc(100% - ${sidebarWidth}px)` : '100%'
  } : {};

  return (
    <header 
      className={`fixed top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-4 lg:px-8 transition-all duration-250 ease-[cubic-bezier(0.2,0.8,0.2,1)] print-hidden`}
      style={dynamicStyle}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Hamburger button (Mobile only for Admin since Desktop sidebar is always visible) */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-transparent transition-colors hover:bg-surface-variant text-on-surface"
          onClick={onToggle}
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        {/* Search Bar Container */}
        <div className="hidden sm:flex flex-1 max-w-[500px]">
          <SearchBar />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications - shared NotificationBell */}
        <NotificationBell role="admin" />

        {/* User Account */}
        <div className="relative border-l border-outline-variant pl-4" ref={accountRef}>
          <button
            type="button"
            className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-surface-variant transition-colors group"
            onClick={() => setAccountOpen((current) => !current)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white overflow-hidden shadow-sm">
              {avatar ? (
                <img src={avatar} alt="avatar" className="h-full w-full object-cover" onError={() => setAvatar(null)} />
              ) : (
                <span className="font-bold text-sm uppercase">
                  {String(userName || "U").charAt(0)}
                </span>
              )}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{userName}</p>
              <p className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">{userRole}</p>
            </div>
            <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-300 ${accountOpen ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>
          
          {accountOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="space-y-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-600"
                  onClick={() => { setAccountOpen(false); navigate(`${basePath}/profile`); }}
                >
                  <span className="material-symbols-outlined text-[20px]">person</span>
                  <span>Thông tin cá nhân</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-600"
                  onClick={() => { setAccountOpen(false); navigate(`${basePath}/profile/change-password`); }}
                >
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                  <span>Đổi mật khẩu</span>
                </button>
                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
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
