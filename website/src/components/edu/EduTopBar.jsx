import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Lock,
  X
} from "lucide-react";
import { clearAuth, getRole } from "../../store/authStore.js";
import { getCurrentUsernameFromToken } from "../../utils/teacherProfile.js";
import { readCachedAvatar, writeCachedAvatar } from "../../utils/avatarCache.js";
import CachedAvatar from "../common/CachedAvatar.jsx";
import { getThongBao } from "../../api/thongbaoApi.js";
import { formatDate } from "../../utils/helpers.js";
import axiosClient from "../../api/axiosClient.js";
import { webSocketService } from "../../utils/websocket.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function EduTopBar({
  searchPlaceholder = "Tìm kiếm...",
  userName = "Quản trị viên",
  userRole = "Admin",
  onToggle,
  isOpen = false,
  hideEdit = false,
  navLinks = null,
  sidebarWidth
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
  const [mobileOpenGroups, setMobileOpenGroups] = useState({ "Học tập": true, "Theo dõi con": true });
  const groupRefsMap = useRef({});
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { themeLogo } = useTheme();

  const flatNavItems = useMemo(() => {
    if (!navLinks) return [];
    const items = [];
    navLinks.forEach((item) => {
      if (item.path) {
        items.push(item);
      } else if (item.children) {
        item.children.forEach((child) => items.push(child));
      }
    });
    return items;
  }, [navLinks]);

  useEffect(() => {
    if (!currentRole || !currentUsername) return;
    const role = String(currentRole).toUpperCase();
    const fetchFreshAvatar = async () => {
      try {
        let freshAvatar = null;
        if (role === "HOCSINH" || role === "HOC_SINH") {
          const res = await axiosClient.get("/hocsinh/me", { skipCache: true });
          freshAvatar = res?.data?.data?.anhDaiDien || null;
        } else if (role === "GIAOVIEN" || role === "GIAO_VIEN") {
          const res = await axiosClient.get("/giaovien/me", { skipCache: true });
          freshAvatar = res?.data?.data?.anhDaiDien || null;
        } else if (role === "ADMIN") {
          const res = await axiosClient.get("/users/me", { skipCache: true });
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
    return () => window.removeEventListener("httt_avatar_changed", onAvatarChanged);
  }, [currentUsername, currentRole]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
      if (groupRefsMap.current) {
        let clickedInsideAnyGroup = false;
        Object.values(groupRefsMap.current).forEach((el) => {
          if (el && el.contains(event.target)) {
            clickedInsideAnyGroup = true;
          }
        });
        if (!clickedInsideAnyGroup) {
          setOpenGroup(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    let userId = null;
    const fetchNotices = async () => {
      try {
        const res = await getThongBao();
        if (!active) return;
        const list = res?.data?.data || [];
        setNotices(list);
      } catch {
        if (!active) return;
        setNotices([]);
      }
    };
    const setupWebSocket = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          userId = user.id;
        }
        if (userId) {
          webSocketService.subscribe(`/topic/user/${userId}`, (notification) => {
            if (!active) return;
            setNotices((prev) => [
              {
                id: notification.id || Date.now(),
                tieuDe: notification.tieuDe || notification.title || "Thông báo mới",
                noiDung: notification.noiDung || notification.content || "",
                ngayDang: notification.ngayDang || new Date().toISOString(),
                daDoc: false
              },
              ...prev
            ]);
          });
        }
        const role = getRole();
        if (role) {
          webSocketService.subscribe('/topic/notifications', (notification) => {
            if (!active) return;
            setNotices((prev) => [
              {
                id: notification.id || Date.now(),
                tieuDe: notification.tieuDe || notification.title || "Thông báo chung",
                noiDung: notification.noiDung || notification.content || "",
                ngayDang: notification.ngayDang || new Date().toISOString(),
                daDoc: false
              },
              ...prev
            ]);
          });
        }
      } catch {}
    };
    fetchNotices();
    setupWebSocket();
    return () => { 
      active = false;
      if (userId) webSocketService.unsubscribe(`/topic/user/${userId}`);
      webSocketService.unsubscribe('/topic/notifications');
    };
  }, [currentRole, currentUsername]);

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
    left: typeof window !== "undefined" && window.innerWidth >= 1024 ? sidebarWidth : 0,
    width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `calc(100% - ${sidebarWidth}px)` : '100%'
  } : {};

  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('eduReadNoticeIds') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const newReadIds = JSON.parse(localStorage.getItem('eduReadNoticeIds') || '[]');
        setReadIds(newReadIds);
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const unreadNoticeCount = notices.filter(n => !readIds.includes(n.id)).length;

  const handleOpenNoti = () => {
    setNotiOpen(!notiOpen);
  };

  const handleNoticeClick = (noticeId) => {
    setNotiOpen(false);
    if (!readIds.includes(noticeId)) {
      const newReadIds = [...readIds, noticeId];
      setReadIds(newReadIds);
      try { localStorage.setItem('eduReadNoticeIds', JSON.stringify(newReadIds)); } catch {}
    }
    navigate(`${resolveBasePath()}/thongbao`);
  };

  const renderNavIcon = (icon, active = false, size = "text-[18px]") => {
    if (!icon) return null;
    if (typeof icon === "string") {
      return (
        <span className={`material-symbols-outlined ${size} shrink-0 ${active ? "text-white" : ""}`}>
          {icon}
        </span>
      );
    }
    const IconComp = icon;
    return <IconComp size={18} className={`shrink-0 ${active ? "text-white" : ""}`} />;
  };

  return (
    <>
      <header
        className={`fixed top-0 z-40 flex flex-col w-full bg-primary border-b border-primary shadow-md transition-all duration-300 ${sidebarWidth === undefined ? (!navLinks ? (isOpen ? "lg:left-[250px] lg:w-[calc(100%-250px)]" : "lg:left-[80px] lg:w-[calc(100%-80px)]") : "lg:left-0 lg:w-full") : ""}`}
        style={dynamicStyle}
      >
        <div className="flex h-16 w-full items-center justify-between px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {!navLinks && (
              <button
                type="button"
                className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-transparent transition-all duration-300 ease-out hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label={isOpen ? "Đóng menu" : "Mở menu"}
                onClick={onToggle}
              >
                <Menu className={`w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110 ${!isOpen ? "rotate-90" : ""}`} />
              </button>
            )}
            {navLinks && (
              <button
                type="button"
                className="lg:hidden group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-transparent transition-all duration-300 ease-out hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label={isOpen ? "Đóng menu" : "Mở menu"}
                onClick={onToggle}
              >
                <Menu className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
              </button>
            )}
            {navLinks && (
              <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
                {navLinks.map((item) => {
                  if (item.path) {
                    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                          isActive
                            ? "bg-white/20 text-white shadow-xs"
                            : "text-white/80 bg-transparent hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {renderNavIcon(item.icon, isActive, "text-[18px]")}
                        <span>{item.label}</span>
                      </Link>
                    );
                  }
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
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                            hasActiveChild
                              ? "bg-white/20 text-white"
                              : "text-white/80 bg-transparent hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span>{item.group}</span>
                          <ChevronDown size={15} className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                        <div
                          className={`absolute left-0 top-full mt-2 w-[220px] rounded-xl bg-white border border-slate-100 shadow-xl transition-all duration-200 origin-top-left z-50 ${
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
                                  className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-xs transition-colors duration-150 ${
                                    isChildActive
                                      ? "bg-blue-50 text-blue-700 font-bold"
                                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                                  }`}
                                >
                                  {renderNavIcon(child.icon, false, "text-[16px]")}
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

          <div className="flex justify-center items-center shrink-0 px-2">
            {(() => {
              const targetPath = currentRole === "ADMIN" ? "/admin/dashboard" : (currentRole === "GIAOVIEN" || currentRole === "TEACHER") ? "/teacher/dashboard" : (currentRole === "HOCSINH" || currentRole === "STUDENT") ? "/student/home" : (currentRole === "PHUHUYNH" || currentRole === "PARENT") ? "/parent/home" : "/admin/dashboard";
              return (
                <Link
                  to={targetPath}
                  onClick={(e) => {
                    if (pathname === targetPath) {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  title="Về trang tổng quan"
                >
                  <img
                    src={themeLogo}
                    alt="Logo Edu Manager"
                    className="h-10 sm:h-12 md:h-14 max-w-[140px] sm:max-w-[200px] w-auto object-contain drop-shadow-xs brightness-0 invert shrink-0"
                  />
                </Link>
              );
            })()}
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 min-w-0">
            <form onSubmit={handleSearch} className="hidden xl:flex items-center relative mr-1">
              <div className="absolute left-3 text-slate-400">
                <Search size={15} />
              </div>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px] 2xl:w-[260px] h-[36px] pl-9 pr-4 bg-white/10 border border-white/20 rounded-full text-xs text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all"
              />
            </form>

            <div className="relative shrink-0" ref={notiRef}>
              <button
                type="button"
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white focus:outline-none"
                onClick={handleOpenNoti}
                aria-label="Thông báo"
              >
                <Bell size={19} className={`transition-transform duration-300 ${notiOpen ? "rotate-[15deg]" : ""}`} />
                {unreadNoticeCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none border-2 border-primary">
                    {unreadNoticeCount > 9 ? "9+" : unreadNoticeCount}
                  </span>
                )}
              </button>

              <div
                className={`fixed left-3 right-3 top-14 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl bg-white border border-slate-100 shadow-2xl transition-all duration-200 origin-top sm:origin-top-right z-50 ${
                  notiOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h3 className="font-bold text-sm text-slate-800">Thông báo</h3>
                  <span className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`${resolveBasePath()}/thongbao`)}>
                    Xem tất cả
                  </span>
                </div>
                <div className="max-h-[360px] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                  {notices.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 font-medium">Không có thông báo mới</div>
                  ) : (
                    notices.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNoticeClick(n.id)}
                        className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer border ${
                          !readIds.includes(n.id)
                            ? "bg-blue-50/60 border-blue-100 hover:bg-blue-50"
                            : "hover:bg-slate-50 border-transparent hover:border-slate-100"
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-800 line-clamp-2">{n.tieuDe}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{formatDate(n.ngayDang)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="relative shrink-0" ref={accountRef}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5 sm:pr-3 transition-colors duration-200 hover:bg-white/10 border border-transparent focus:outline-none"
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
                  className="h-8 w-8 sm:h-[34px] sm:w-[34px] rounded-full object-cover shadow-xs border border-white/40 bg-white shrink-0 aspect-square"
                  fallbackClassName="h-8 w-8 sm:h-[34px] sm:w-[34px] rounded-full bg-white flex items-center justify-center text-primary font-bold shrink-0 text-xs sm:text-sm aspect-square"
                />
                <div className="hidden flex-col items-start md:flex min-w-0 max-w-[140px]">
                  <span className="text-xs font-bold text-white truncate w-full text-left">{userName}</span>
                  <span className="text-[11px] font-medium text-white/80 truncate w-full text-left">{userRole}</span>
                </div>
              </button>

              <div
                className={`fixed right-3 left-auto top-14 sm:absolute sm:right-0 sm:top-full sm:mt-2 w-[calc(100vw-24px)] max-w-[280px] sm:w-64 rounded-2xl bg-white border border-slate-100 shadow-2xl transition-all duration-200 origin-top-right z-50 ${
                  accountOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                }`}
              >
                <div className="flex items-center gap-3 border-b border-slate-100 p-3.5">
                  <CachedAvatar
                    username={currentUsername}
                    role={currentRole}
                    src={avatar}
                    fallback={(() => {
                      const parts = (userName || "U").trim().split(" ");
                      return parts[parts.length - 1].charAt(0).toUpperCase();
                    })()}
                    className="h-10 w-10 rounded-full object-cover shadow-xs border border-slate-200 bg-white shrink-0 aspect-square"
                    fallbackClassName="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0 text-sm aspect-square"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-slate-800 truncate">{userName}</span>
                    <span className="text-[11px] font-semibold text-slate-500 truncate">{userRole}</span>
                  </div>
                </div>

                <div className="p-2 flex flex-col gap-0.5">
                  {!hideEdit && (
                    <>
                      <Link
                        to={`${resolveBasePath()}/profile`}
                        className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        onClick={() => setAccountOpen(false)}
                      >
                        <UserIcon size={16} className="text-slate-400 shrink-0" />
                        Hồ sơ cá nhân
                      </Link>
                      <Link
                        to={`${resolveBasePath()}/profile/change-password`}
                        className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        onClick={() => setAccountOpen(false)}
                      >
                        <Lock size={16} className="text-slate-400 shrink-0" />
                        Đổi mật khẩu
                      </Link>
                      <div className="h-px bg-slate-100 my-1"></div>
                    </>
                  )}
                  <button
                    type="button"
                    className="flex items-center w-full gap-3 px-3 py-2 text-xs font-bold text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setAccountOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut size={16} className="shrink-0" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {navLinks && (
          <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-primary/95 border-t border-white/10 overflow-x-auto no-scrollbar scroll-smooth">
            {flatNavItems.map((child) => {
              const isActive = pathname === child.path || pathname.startsWith(`${child.path}/`);
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-150 active:scale-95 ${
                    isActive
                      ? "bg-white text-primary font-bold shadow-xs"
                      : "text-white/85 bg-white/10 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {renderNavIcon(child.icon, isActive, "text-[15px]")}
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {navLinks && (
        <>
          <div
            className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
              isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={onToggle}
            aria-hidden="true"
          />

          <div
            className={`fixed top-0 left-0 bottom-0 z-50 w-[280px] sm:w-[320px] max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out lg:hidden ${
              isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"
            }`}
          >
            <div className="flex items-center justify-between p-4 bg-primary text-white border-b border-primary/20">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={themeLogo}
                  alt="Logo Edu Manager"
                  className="h-9 w-auto object-contain brightness-0 invert drop-shadow-xs shrink-0"
                />
                <div className="min-w-0">
                  <span className="font-extrabold text-sm tracking-tight text-white block leading-tight truncate">
                    Edu Manager
                  </span>
                  <span className="text-[11px] font-medium text-white/80 block truncate">
                    {userRole || "Hệ thống trường THPT"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                aria-label="Đóng menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3">
              <CachedAvatar
                username={currentUsername}
                role={currentRole}
                src={avatar}
                fallback={(() => {
                  const parts = (userName || "U").trim().split(" ");
                  return parts[parts.length - 1].charAt(0).toUpperCase();
                })()}
                className="h-10 w-10 rounded-full object-cover shadow-xs border border-slate-200 bg-white shrink-0 aspect-square"
                fallbackClassName="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0 text-sm aspect-square"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
                <p className="text-[11px] font-semibold text-blue-600 truncate">{userRole}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              {navLinks.map((item) => {
                if (item.path) {
                  const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onToggle}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-100 hover:text-blue-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {renderNavIcon(item.icon, isActive, "text-[18px]")}
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-2" />}
                    </Link>
                  );
                }
                if (item.group) {
                  const hasActiveChild = item.children?.some(
                    (child) => pathname === child.path || pathname.startsWith(`${child.path}/`)
                  );
                  const isGroupOpen = mobileOpenGroups[item.group] !== false;
                  return (
                    <div key={item.group} className="space-y-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMobileOpenGroups(prev => ({
                            ...prev,
                            [item.group]: !isGroupOpen
                          }));
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          hasActiveChild
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "text-slate-700 hover:bg-slate-100 hover:text-blue-900"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {renderNavIcon(item.icon, hasActiveChild, "text-[18px]")}
                          <span className="truncate">{item.group}</span>
                        </div>
                        <ChevronDown
                          size={15}
                          className={`transition-transform duration-200 text-slate-400 shrink-0 ml-2 ${
                            isGroupOpen ? "rotate-180 text-blue-600" : ""
                          }`}
                        />
                      </button>
                      {isGroupOpen && (
                        <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-slate-200 ml-4 my-1">
                          {item.children?.map((child) => {
                            const isChildActive = pathname === child.path || pathname.startsWith(`${child.path}/`);
                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                onClick={onToggle}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                  isChildActive
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {renderNavIcon(child.icon, isChildActive, "text-[16px]")}
                                  <span className="truncate">{child.label}</span>
                                </div>
                                {isChildActive && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-2" />}
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
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-1">
              {!hideEdit && (
                <Link
                  to={`${resolveBasePath()}/profile`}
                  onClick={onToggle}
                  className="flex items-center gap-3 px-3.5 py-2 text-xs font-bold text-slate-700 rounded-xl hover:bg-white transition-colors"
                >
                  <UserIcon size={16} className="text-slate-500 shrink-0" />
                  <span>Hồ sơ cá nhân</span>
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-bold text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={16} className="shrink-0" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
