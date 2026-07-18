import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import EduSidebar from "../components/edu/EduSidebar.jsx";
import EduTopBar from "../components/edu/EduTopBar.jsx";
import Toast from "../components/common/Toast.jsx";
import PasswordChangeBanner from "../components/common/PasswordChangeBanner.jsx";
import { ADMIN_NAV } from "../config/adminNav.js";
import { getCurrentUsernameFromToken } from "../utils/teacherProfile.js";

export default function AdminLayout() {
  const { pathname } = useLocation();
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
  const [userName, setUserName] = useState("Quản Trị Viên");

  useEffect(() => {
    const username = getCurrentUsernameFromToken();
    if (username) {
      setUserName(username.charAt(0).toUpperCase() + username.slice(1));
    }
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans text-on-background">
      <EduSidebar
        links={ADMIN_NAV}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <EduTopBar
        searchPlaceholder="Tìm kiếm năm học, học sinh, giáo viên..."
        userName={userName}
        userRole="Admin"
        onToggle={() => setSidebarOpen((current) => !current)}
        isOpen={sidebarOpen}
      />
      <Toast />
      <main className={`mt-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar transition-all duration-200 ${sidebarOpen ? "lg:ml-[280px]" : "lg:ml-0"}`}>
        <PasswordChangeBanner />
        <div className="mx-auto max-w-container-max p-lg">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
