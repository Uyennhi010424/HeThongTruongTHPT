import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getCurrentHocSinh } from "../api/hocsinhApi.js";
import EduTopBar from "../components/edu/EduTopBar.jsx";
import Toast from "../components/common/Toast.jsx";
import PasswordChangeBanner from "../components/common/PasswordChangeBanner.jsx";
import { STUDENT_NAV } from "../config/studentNav.js";

const links = STUDENT_NAV;

export default function StudentLayout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState({ student: null });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        const response = await getCurrentHocSinh();
        if (!active) return;
        setProfile({ student: response?.data?.data || null });
      } catch {
        if (!active) return;
        setProfile({ student: null });
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
        userName={profile.student?.hoTen || "Học sinh"}
        userRole="Học sinh"
        onToggle={() => setMenuOpen((current) => !current)}
        isOpen={menuOpen}
        hideEdit
        navLinks={links}
      />
      <Toast />
      <main className="mt-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar app-main-bg transition-all duration-200">
        <PasswordChangeBanner />
        <div className="mx-auto max-w-container-max space-y-6 p-lg">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
