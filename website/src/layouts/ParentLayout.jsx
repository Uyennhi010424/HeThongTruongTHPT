import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getCurrentPhuHuynh } from "../api/phuhuynhApi.js";
import EduTopBar from "../components/edu/EduTopBar.jsx";
import Toast from "../components/common/Toast.jsx";
import PasswordChangeBanner from "../components/common/PasswordChangeBanner.jsx";
import { PARENT_NAV } from "../config/parentNav.js";
import { useTheme } from "../contexts/ThemeContext.jsx";

const links = PARENT_NAV;

export default function ParentLayout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState({ parent: null, students: [] });
  const { themeFooter } = useTheme();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        const response = await getCurrentPhuHuynh();
        if (!active) return;
        setProfile({ parent: response?.data?.data || null });
      } catch {
        if (!active) return;
        setProfile({ parent: null });
      }
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-background font-sans text-on-background">
      <EduTopBar
        searchPlaceholder="Tìm kiếm thông báo, thời khóa biểu, bảng điểm..."
        userName={profile.parent?.hoTen || "Phụ huynh"}
        userRole="Phụ huynh"
        onToggle={() => setMenuOpen((current) => !current)}
        isOpen={menuOpen}
        navLinks={links}
      />
      <Toast />
      <main className="mt-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar app-main-bg transition-all duration-200">
        <div className="flex flex-col min-h-full">
          <PasswordChangeBanner />
          <div className="w-full flex-grow">
            <Outlet />
          </div>
          <div className="mt-auto py-6 text-center text-sm font-medium text-gray-500 border-t border-outline-variant/30 print-hidden shrink-0 bg-background relative z-50">
            {themeFooter}
          </div>
        </div>
      </main>
    </div>
  );
}
