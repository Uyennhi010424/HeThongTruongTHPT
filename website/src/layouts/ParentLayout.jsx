import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/common/Sidebar.jsx";
import Footer from "../components/common/Footer.jsx";

const links = [
  { path: "/parent/home", label: "Trang chủ" },
  { path: "/parent/score", label: "Theo dõi điểm" },
  { path: "/parent/timetable", label: "Thời khóa biểu" }
];

export default function ParentLayout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
    <div className="layout">
      <button
        type="button"
        className="mobile-menu-btn"
        aria-label="Mở menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span className="mobile-menu-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      <div
        className={`layout-menu-overlay ${menuOpen ? "is-visible" : ""}`}
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
      />
      <Sidebar title="Phụ huynh" links={links} isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="content">
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}