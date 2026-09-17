import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AdminSidebar from "../components/admin/sidebar/AdminSidebar.jsx";
import AdminHeader from "../components/admin/header/AdminHeader.jsx";
import Toast from "../components/common/Toast.jsx";
import PasswordChangeBanner from "../components/common/PasswordChangeBanner.jsx";
import { AdminSearchProvider } from "../contexts/AdminSearchContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";

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
  
  const { themeFooter } = useTheme();

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

  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 1024 : true);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!desktop) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
        className="mt-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar transition-all duration-300 print:mt-0 print:h-auto print:overflow-visible print:ml-0 print:w-full print:p-0"
        style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}
      >
        <div className="flex flex-col min-h-full">
          <div className="print-hidden">
            <PasswordChangeBanner />
          </div>
          <div className="mx-auto max-w-container-max p-lg print:p-0 print:max-w-none print:mx-0 w-full flex-grow">
            {children}
          </div>
          <div className="mt-auto py-6 text-center text-sm font-medium text-gray-500 border-t border-outline-variant/30 print-hidden shrink-0 bg-background relative">
            {themeFooter}
          </div>
        </div>
      </main>
    </div>
    </AdminSearchProvider>
  );
}
