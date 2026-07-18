import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import MaterialIcon from "./MaterialIcon.jsx";
import { clearAuth, getRole } from "../../store/authStore.js";
import { getCurrentUsernameFromToken } from "../../utils/teacherProfile.js";
import { readCachedAvatar } from "../../utils/avatarCache.js";
import { getThongBao } from "../../api/thongbaoApi.js";
import { formatDate } from "../../utils/helpers.js";

export default function EduTopBar({
  searchPlaceholder = "Tìm kiếm...",
  userName = "Quản trị viên",
  userRole = "Admin",
  onToggle,
  isOpen = false,
  hideEdit = false,
  navLinks = null
}) {
  const currentUsername = getCurrentUsernameFromToken();
  const currentRole = getRole();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const [notiOpen, setNotiOpen] = useState(false);
  const notiRef = useRef(null);
  const [notices, setNotices] = useState([]);
  const [avatar, setAvatar] = useState(() =>
    readCachedAvatar({ username: currentUsername, role: currentRole })
  );
  const [openGroup, setOpenGroup] = useState(null);
  const groupRefsMap = useRef({});
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const onAvatarChanged = (e) => {
      const detail = e?.detail;

      // Backward compatibility: old events sent avatar string only.
      if (typeof detail === "string") {
        setAvatar(detail || readCachedAvatar({ username: currentUsername, role: currentRole }));
        return;
      }

      const changedUser = String(detail?.username || "").toLowerCase();
      const changedRole = String(detail?.role || "").toLowerCase();

      if (
        changedUser &&
        changedUser === String(currentUsername || "").toLowerCase() &&
        changedRole === String(currentRole || "").toLowerCase()
      ) {
        setAvatar(String(detail?.avatar || ""));
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
      if (event.key === "Escape") {
        setAccountOpen(false);
        setOpenGroup(null);
      }
    };

    const handleClickOutsideGroup = (event) => {
      if (openGroup && groupRefsMap.current[openGroup] && !groupRefsMap.current[openGroup].contains(event.target)) {
        setOpenGroup(null);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("mousedown", handleClickOutsideGroup);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("mousedown", handleClickOutsideGroup);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("httt_avatar_changed", onAvatarChanged);
    };
  }, [currentUsername, currentRole, openGroup]);

  // Fetch notifications
  useEffect(() => {
    let active = true;
    getThongBao()
      .then((res) => {
        if (!active) return;
        const all = res?.data?.data || [];
        const role = getRole();
        const filtered = all
          .filter((item) => {
            if (role === "ADMIN" || role === "VAN_THU") {
              const creatorRole = item.nguoiTao?.role;
              const creatorUsername = item.nguoiTao?.username;
              return creatorRole !== "ADMIN" && creatorRole !== "VAN_THU" && creatorUsername !== currentUsername;
            }
            if (role === "GIAOVIEN") return item.doiTuong === "GIAO_VIEN" || item.doiTuong === "ALL";
            if (role === "HOCSINH") return item.doiTuong === "HOC_SINH" || item.doiTuong === "ALL";
            if (role === "PHUHUYNH") return item.doiTuong === "PHU_HUYNH" || item.doiTuong === "ALL";
            return true;
          })
          .sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang));
        if (active) setNotices(filtered.slice(0, 8));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [currentRole, currentUsername]);

  // Close notification dropdown on click outside
  useEffect(() => {
    if (!notiOpen) return;
    const handleClick = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) {
        setNotiOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setNotiOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [notiOpen]);

  const resolveBasePath = () => {
    if (pathname.startsWith("/admin")) return "/admin";
    if (pathname.startsWith("/teacher")) return "/teacher";
    if (pathname.startsWith("/student")) return "/student";
    if (pathname.startsWith("/parent")) return "/parent";
    return "/";
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <header className={`fixed left-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-md transition-all duration-200 lg:px-lg ${!navLinks && isOpen ? "lg:left-[280px] lg:w-[calc(100%-280px)]" : "lg:left-0 lg:w-full"}`}>
      <div className="flex items-center gap-sm">
        {/* Hamburger button - only for sidebar layouts */}
        {!navLinks && (
          <button
            type="button"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface transition-all hover:bg-surface-container-low"
            aria-label={isOpen ? "Đóng menu" : "Mở menu"}
            aria-controls="admin-sidebar"
            aria-expanded={isOpen}
            onClick={onToggle}
          >
            <span className={`block h-0.5 w-5 bg-primary transition-all rounded-full ${isOpen ? "translate-y-2 rotate-45" : ""}`}></span>
            <span className={`block h-0.5 w-5 bg-primary transition-all rounded-full ${isOpen ? "opacity-0" : ""}`}></span>
            <span className={`block h-0.5 w-5 bg-primary transition-all rounded-full ${isOpen ? "-translate-y-2 -rotate-45" : ""}`}></span>
          </button>
        )}

        {/* Mobile menu button for header nav */}
        {navLinks && (
          <button
            type="button"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface transition-all hover:bg-surface-container-low lg:hidden"
            aria-label={isOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={isOpen}
            onClick={onToggle}
          >
            <span className={`block h-0.5 w-5 bg-primary transition-all rounded-full ${isOpen ? "translate-y-2 rotate-45" : ""}`}></span>
            <span className={`block h-0.5 w-5 bg-primary transition-all rounded-full ${isOpen ? "opacity-0" : ""}`}></span>
            <span className={`block h-0.5 w-5 bg-primary transition-all rounded-full ${isOpen ? "-translate-y-2 -rotate-45" : ""}`}></span>
          </button>
        )}
      </div>

      {/* Navigation links in header */}
      {navLinks && (
        <nav className="hidden lg:flex items-center gap-1 flex-1 mx-4">
          {navLinks.map((item, idx) => {
            // Flat link
            if (item.path) {
              const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  {item.icon && (
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            }

            // Grouped link with dropdown
            if (item.group) {
              const hasActiveChild = item.children?.some(
                (child) => pathname === child.path || pathname.startsWith(`${child.path}/`)
              );
              const isDropdownOpen = openGroup === item.group;

              return (
                <div key={item.group} className="relative" ref={(el) => { groupRefsMap.current[item.group] = el; }}>
                  <button
                    type="button"
                    onClick={() => setOpenGroup(isDropdownOpen ? null : item.group)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                      hasActiveChild
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                    }`}
                  >
                    <span>{item.group}</span>
                    <span
                      className="material-symbols-outlined text-[18px] transition-transform duration-200"
                      style={{ transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      expand_more
                    </span>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
                      {item.children?.map((child) => {
                        const isActive = pathname === child.path || pathname.startsWith(`${child.path}/`);
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setOpenGroup(null)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-150 ${
                              isActive
                                ? "bg-primary text-white font-semibold"
                                : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                            }`}
                          >
                            {child.icon && (
                              <span className="material-symbols-outlined text-[18px]">{child.icon}</span>
                            )}
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </nav>
      )}

      <div className="flex items-center gap-md">
        <div className="relative" ref={notiRef}>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-surface-container-low"
            aria-label="Thông báo"
            title="Thông báo"
            onClick={() => setNotiOpen((v) => !v)}
          >
            <span className="material-symbols-outlined text-[22px] text-on-surface-variant">notifications</span>
            {notices.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
            )}
          </button>
          {notiOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-80 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-card">
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
                <span className="font-label-md text-label-md text-on-surface font-semibold">Thông báo</span>
                <span className="text-label-sm text-on-surface-variant">{notices.length} mục</span>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notices.length === 0 ? (
                  <div className="px-4 py-6 text-center text-on-surface-variant text-sm">Chưa có thông báo</div>
                ) : (
                  notices.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 px-4 py-3 border-b border-outline-variant/50 transition-colors hover:bg-surface-container-low cursor-pointer"
                      onClick={() => {
                        setNotiOpen(false);
                        const base = pathname.startsWith("/admin") ? "/admin"
                          : pathname.startsWith("/teacher") ? "/teacher"
                          : pathname.startsWith("/student") ? "/student"
                          : pathname.startsWith("/parent") ? "/parent" : "/";
                        navigate(`${base}/thongbao`);
                      }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <span className={`material-symbols-outlined text-[18px] ${item.doiTuong === "ALL" ? "text-primary" : "text-warning"}`}>
                          {item.doiTuong === "ALL" ? "campaign" : "school"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{item.tieuDe}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{item.noiDung}</p>
                        <p className="text-xs text-on-surface-variant mt-1">{formatDate(item.ngayDang)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notices.length > 0 && (
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-sm font-medium text-primary text-center border-t border-outline-variant transition-colors hover:bg-surface-container-low"
                  onClick={() => {
                    setNotiOpen(false);
                    const base = pathname.startsWith("/admin") ? "/admin"
                      : pathname.startsWith("/teacher") ? "/teacher"
                      : pathname.startsWith("/student") ? "/student"
                      : pathname.startsWith("/parent") ? "/parent" : "/";
                    navigate(`${base}/thongbao`);
                  }}
                >
                  Xem tất cả thông báo
                </button>
              )}
            </div>
          )}
        </div>
        <div className="relative flex items-center gap-2 border-l border-outline-variant pl-3" ref={accountRef}>
          <div className="hidden text-right leading-tight sm:block">
            <p className="font-label-md text-label-md leading-tight text-on-surface">{userName}</p>
            <p className="font-label-sm text-label-sm leading-tight text-on-surface-variant">{userRole}</p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary overflow-hidden border border-outline-variant"
            aria-label="Tài khoản"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((current) => !current)}
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="h-10 w-10 object-cover" />
            ) : (
              <span className="font-bold text-sm uppercase text-primary-fixed-variant bg-primary-fixed w-full h-full flex items-center justify-center">
                {String(userName || "U").charAt(0)}
              </span>
            )}
          </button>
          {accountOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-2 shadow-card">
              <div className="rounded-xl bg-surface-container-low px-4 py-3">
                <p className="font-label-md text-label-md text-on-surface">{userName}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{userRole}</p>
              </div>

              <div className="mt-2 space-y-1">
                {[
                    { label: "Thông tin cá nhân", to: "profile" },
                    { label: "Chỉnh sửa hồ sơ", to: "profile/edit" },
                    { label: "Đổi mật khẩu", to: "profile/change-password" },
                    { label: "Cài đặt", to: "profile/settings" }
                  ]
                  .filter((item) => !hideEdit || item.to === "profile")
                  .map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="flex w-full items-center rounded-xl px-4 py-2 text-left font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
                      onClick={() => {
                        setAccountOpen(false);
                        const base = resolveBasePath();
                        const path = base === "/" ? `/${item.to}` : `${base}/${item.to}`;
                        navigate(path, { replace: false });
                      }}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                <button
                  type="button"
                  className="flex w-full items-center rounded-xl px-4 py-2 text-left font-label-md text-label-md text-error transition-colors hover:bg-error-container/40"
                  onClick={handleLogout}
                >
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation dropdown */}
      {navLinks && isOpen && (
        <div className="fixed left-0 top-16 z-40 w-full bg-surface-container-lowest border-b border-outline-variant shadow-lg lg:hidden">
          <nav className="flex flex-col p-md gap-1 max-h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
            {navLinks.map((item) => {
              // Flat link
              if (item.path) {
                const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => onToggle()}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                    }`}
                  >
                    {item.icon && (
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    )}
                    <span>{item.label}</span>
                  </Link>
                );
              }

              // Grouped links
              if (item.group) {
                return (
                  <div key={item.group} className="mt-2">
                    <p className="px-4 py-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      {item.group}
                    </p>
                    {item.children?.map((child) => {
                      const isActive = pathname === child.path || pathname.startsWith(`${child.path}/`);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => onToggle()}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
                            isActive
                              ? "bg-primary text-white"
                              : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                          }`}
                        >
                          {child.icon && (
                            <span className="material-symbols-outlined text-[20px]">{child.icon}</span>
                          )}
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              }

              return null;
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
