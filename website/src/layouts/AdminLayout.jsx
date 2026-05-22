import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import EduSidebar from "../components/edu/EduSidebar.jsx";
import EduTopBar from "../components/edu/EduTopBar.jsx";
import { ADMIN_NAV } from "../config/adminNav.js";

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen overflow-hidden bg-background font-sans text-on-background">
      <EduSidebar
        links={ADMIN_NAV}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <EduTopBar
        searchPlaceholder="Tìm kiếm năm học, học sinh, giáo viên..."
        userName="Quản Trị Viên"
        userRole="Admin"
        onToggle={() => setSidebarOpen((current) => !current)}
        isOpen={sidebarOpen}
      />
      <main className="mt-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar p-lg lg:ml-[280px]">
        <div className="mx-auto max-w-container-max">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
