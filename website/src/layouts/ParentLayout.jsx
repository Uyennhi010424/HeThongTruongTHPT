import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getCurrentPhuHuynh } from "../api/phuhuynhApi.js";
import EduSidebar from "../components/edu/EduSidebar.jsx";
import EduTopBar from "../components/edu/EduTopBar.jsx";
import Toast from "../components/common/Toast.jsx";
import PasswordChangeBanner from "../components/common/PasswordChangeBanner.jsx";
import { PARENT_NAV } from "../config/parentNav.js";

const links = PARENT_NAV;

export default function ParentLayout() {
  const { pathname } = useLocation();
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
  const [menuOpen, setMenuOpen] = useState(isDesktop);
  const [profile, setProfile] = useState({ parent: null });

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
      <EduSidebar
        links={links}
        title="Phụ huynh"
        subtitle="Hệ thống quản lý giáo dục"
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        navClassName="space-y-2"
      />
      <EduTopBar
        searchPlaceholder="Tìm kiếm thông báo, thời khóa biểu, bảng điểm..."
        userName={profile.parent?.hoTen || "Phụ huynh"}
        userRole="Phụ huynh"
        onToggle={() => setMenuOpen((current) => !current)}
        isOpen={menuOpen}
      />
      <Toast />
      <main className={`mt-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar app-main-bg transition-all duration-200 ${menuOpen ? "lg:ml-[280px]" : "lg:ml-0"}`}>
        <PasswordChangeBanner />
        <div className="mx-auto max-w-container-max space-y-6 p-lg">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
