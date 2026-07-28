import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AdminSidebar from "../components/admin/sidebar/AdminSidebar.jsx";
import AdminHeader from "../components/admin/header/AdminHeader.jsx";
import Toast from "../components/common/Toast.jsx";
import PasswordChangeBanner from "../components/common/PasswordChangeBanner.jsx";
import { AdminSearchProvider } from "../contexts/AdminSearchContext.jsx";

export default function MainLayout({
  children,
  navItems,
  basePath,
  userName,
  userRole,
}) {
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const sidebarWidth = isPanelOpen ? 250 : 72; // Expanded (250px) or Collapsed (72px)

  return (
    <AdminSearchProvider>
      <div className="min-h-screen bg-background font-sans text-on-background flex flex-col">
        <AdminSidebar
        navItems={navItems}
        basePath={basePath}
        isMobileOpen={isMobileMenuOpen}
        isDesktopExpanded={isDesktopExpanded}
        onDesktopExpandedChange={setIsDesktopExpanded}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        onPanelStateChange={setIsPanelOpen}
      />
      <AdminHeader
        basePath={basePath}
        userName={userName}
        userRole={userRole}
        onToggle={() => {
          if (window.innerWidth < 1024) {
            setIsMobileMenuOpen((current) => !current);
          } else {
            setIsDesktopExpanded((current) => !current);
          }
        }}
        isOpen={isMobileMenuOpen}
        sidebarWidth={sidebarWidth}
      />
      <Toast />
      <main
        className="mt-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar transition-all duration-300"
        style={{ marginLeft: typeof window !== "undefined" && window.innerWidth >= 1024 ? sidebarWidth : 0 }}
      >
        <PasswordChangeBanner />
        <div className="mx-auto max-w-container-max p-lg">
          {children}
        </div>
      </main>
    </div>
    </AdminSearchProvider>
  );
}
