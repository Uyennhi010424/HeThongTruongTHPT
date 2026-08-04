import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Lock
} from "lucide-react";
import { clearAuth, getRole } from "../../store/authStore.js";
import { getCurrentUsernameFromToken } from "../../utils/teacherProfile.js";
import { readCachedAvatar, writeCachedAvatar } from "../../utils/avatarCache.js";
import CachedAvatar from "../common/CachedAvatar.jsx";
import { getThongBao } from "../../api/thongbaoApi.js";
import { formatDate } from "../../utils/helpers.js";
import axiosClient from "../../api/axiosClient.js";

export default function EduTopBar({
  searchPlaceholder = "Tìm kiếm...",
  userName = "Quản trị viên",
  userRole = "Admin",
  onToggle,
  isOpen = false,
  hideEdit = false,
  navLinks = null,
  sidebarWidth // new prop
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

  // Fetch fresh avatar from DB on mount (syncs changes from mobile)
  useEffect(() => {
    if (!currentRole || !currentUsername) return;
    const role = String(currentRole).toUpperCase();
    const fetchFreshAvatar = async () => {
      try {
        let freshAvatar = null;
        if (role === "HOCSINH" || role === "HOC_SINH") {
          const res = await axiosClient.get("/hocsinh/me", { skipCache: true });
          freshAvatar = res?.data?.data?.anhDaiDien || null;
        }
        if (freshAvatar) {
          writeCachedAvatar({ avatar: freshAvatar, username: currentUsername, role: currentRole });
          setAvatar(freshAvatar);
        }
      } catch {}
    };
    fetchFreshAvatar();
  }, [currentUsername, currentRole]);

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

  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const dynamicStyle = sidebarWidth !== undefined ? {
    left: window.innerWidth >= 1024 ? sidebarWidth : 0,
    width: window.innerWidth >= 1024 ? `calc(100% - ${sidebarWidth}px)` : '100%'
  } : {};

  return (
    <header
      className={`fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${sidebarWidth === undefined ? (!navLinks ? (isOpen ? "lg:left-[250px] lg:w-[calc(100%-250px)]" : "lg:left-[80px] lg:w-[calc(100%-80px)]") : "lg:left-0 lg:w-full") : ""}`}
      style={dynamicStyle}
    >
      {/* LEFT SECTION: Hamburger (for Sidebar) or Nav Links (for Header Nav) */}
      <div className="flex items-center gap-4 flex-1">
        {/* Hamburger for Admin/Teacher (Sidebar) */}
        {!navLinks && (
          <button
            type="button"
            className="group flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all duration-300 ease-out hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label={isOpen ? "Đóng menu" : "Mở menu"}
            onClick={onToggle}
          >
            <Menu className={`w-5 h-5 text-slate-700 transition-transform duration-300 group-hover:scale-110 ${!isOpen ? "rotate-90" : ""}`} />
          </button>
        )}

        {/* Hamburger for Mobile Header Nav */}
        {navLinks && (
          <button
            type="button"
            className="lg:hidden group flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all duration-300 ease-out hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="Mở menu"
            onClick={onToggle}
          >
            <Menu className="w-5 h-5 text-slate-700 transition-transform duration-300 group-hover:scale-110" />
          </button>
        )}

        {/* Navigation links in header (Desktop) */}
        {navLinks && (
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((item, idx) => {
              // Flat link
              if (item.path) {
                const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[15px] font-medium whitespace-nowrap transition-colors duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 bg-transparent hover:bg-slate-100"
                    }`}
                  >
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
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[15px] font-medium whitespace-nowrap transition-colors duration-200 ${
                        hasActiveChild
                          ? "text-blue-600"
                          : "text-slate-600 bg-transparent hover:bg-slate-100"
                      }`}
                    >
                      <span>{item.group}</span>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown Menu */}
                    <div
                      className={`absolute left-0 top-full mt-2 w-[220px] rounded-xl bg-white border border-slate-100 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all duration-200 origin-top-left ${
                        isDropdownOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                      }`}
                    >
                      <div className="py-2 flex flex-col gap-0.5">
                        {item.children?.map((child) => {
                          const isChildActive = pathname === child.path || pathname.startsWith(`${child.path}/`);
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={() => setOpenGroup(null)}
                              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors duration-150 ${
                                isChildActive
                                  ? "bg-blue-50 text-blue-700 font-semibold"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                              }`}
                            >
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </nav>
        )}
      </div>

      {/* CENTER SECTION: Logo */}
      <div className="flex justify-center items-center shrink-0">
        {(() => {
          const targetPath = currentRole === "ADMIN" ? "/admin/dashboard" : (currentRole === "GIAOVIEN" || currentRole === "TEACHER") ? "/teacher/dashboard" : (currentRole === "HOCSINH" || currentRole === "STUDENT") ? "/student/home" : (currentRole === "PHUHUYNH" || currentRole === "PARENT") ? "/parent/home" : "/admin/dashboard";
          return (
            <Link
              to={targetPath}
              onClick={(e) => {
                if (pathname === targetPath) {
                  e.preventDefault();
                  window.location.reload();
                }
              }}
              className="flex items-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Về trang tổng quan"
            >
              <img src="/logo.png" alt="Logo Edu Manager" className="h-[72px] scale-110 w-auto object-contain drop-shadow-sm" />
            </Link>
          );
        })()}
      </div>

      {/* RIGHT SECTION: Search + Notifications + Account */}
      <div className="flex items-center justify-end gap-3 lg:gap-4 flex-1">

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden lg:flex items-center relative mr-2">
          <div className="absolute left-3 text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full lg:w-[220px] xl:w-[280px] h-[38px] pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />
        </form>

        {/* Notifications */}
        <div className="relative shrink-0" ref={notiRef}>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors duration-200 hover:bg-slate-100 focus:outline-none"
            onClick={() => setNotiOpen(!notiOpen)}
            aria-label="Thông báo"
          >
            <Bell size={20} className={`transition-transform duration-300 ${notiOpen ? "rotate-[15deg]" : ""}`} />
            {notices.length > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* Noti Dropdown */}
          <div
            className={`absolute right-0 top-full mt-2 w-80 md:w-96 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all duration-200 origin-top-right ${
              notiOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="font-bold text-slate-800">Thông báo</h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
              {notices.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 font-medium">Không có thông báo mới</div>
              ) : (
                notices.map((n) => (
                  <div key={n.id} onClick={() => { setNotiOpen(false); navigate(`${resolveBasePath()}/thongbao`); }} className="flex flex-col gap-1 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                    <span className="text-sm font-semibold text-slate-800 line-clamp-2">{n.tieuDe}</span>
                    <span className="text-xs text-slate-500 font-medium">{formatDate(n.ngayDang)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Account Dropdown */}
        <div className="relative shrink-0" ref={accountRef}>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors duration-200 hover:bg-slate-50 border border-transparent hover:border-slate-200 focus:outline-none"
            onClick={() => setAccountOpen(!accountOpen)}
            aria-label="Tài khoản"
          >
            <CachedAvatar
              username={currentUsername}
              role={currentRole}
              src={avatar}
              fallback={(() => {
                const parts = (userName || "U").trim().split(" ");
                return parts[parts.length - 1].charAt(0).toUpperCase();
              })()}
              className="h-[34px] w-[34px] rounded-full object-cover shadow-sm border border-slate-200 bg-white"
              fallbackClassName="h-[34px] w-[34px] rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0"
            />
            <div className="hidden flex-col items-start md:flex">
              <span className="text-sm font-semibold text-slate-800 line-clamp-1">{userName}</span>
              <span className="text-xs font-medium text-slate-500">{userRole}</span>
            </div>
          </button>

          <div
            className={`absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all duration-200 origin-top-right ${
              accountOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
            }`}
          >
            <div className="flex items-center gap-3 border-b border-slate-100 p-4">
              <CachedAvatar
                username={currentUsername}
                role={currentRole}
                src={avatar}
                fallback={(() => {
                  const parts = (userName || "U").trim().split(" ");
                  return parts[parts.length - 1].charAt(0).toUpperCase();
                })()}
                className="h-12 w-12 rounded-full object-cover shadow-sm border border-slate-200 bg-white"
                fallbackClassName="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 text-lg"
              />
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 line-clamp-1">{userName}</span>
                <span className="text-xs font-medium text-slate-500">{userRole}</span>
              </div>
            </div>

            <div className="p-2 flex flex-col gap-1">
              {!hideEdit && (
                <>
                  <Link
                    to={`${resolveBasePath()}/profile`}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    onClick={() => setAccountOpen(false)}
                  >
                    <UserIcon size={18} className="text-slate-400" />
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    to={`${resolveBasePath()}/profile/change-password`}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    onClick={() => setAccountOpen(false)}
                  >
                    <Lock size={18} className="text-slate-400" />
                    Đổi mật khẩu
                  </Link>
                  <div className="h-px bg-slate-100 my-1"></div>
                </>
              )}
              <button
                type="button"
                className="flex items-center w-full gap-3 px-3 py-2 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
