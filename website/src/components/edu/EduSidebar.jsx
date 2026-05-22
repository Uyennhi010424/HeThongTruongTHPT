import { Link, useLocation } from "react-router-dom";
import MaterialIcon from "./MaterialIcon.jsx";

export default function EduSidebar({
  links,
  title = "EduManager Pro",
  subtitle = "Hệ thống quản lý giáo dục",
  isOpen = false,
  onClose
}) {
  const { pathname } = useLocation();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        id="admin-sidebar"
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] -translate-x-full flex-col bg-primary py-md shadow-md transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : ""
        }`}
        aria-label="Điều hướng quản trị"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-xl flex items-start justify-between gap-md px-lg">
          <div>
            <h1 className="text-headline-md font-bold text-on-primary">{title}</h1>
            <p className="text-label-sm text-on-primary/70">{subtitle}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-on-primary/10 text-on-primary transition-colors hover:bg-on-primary/20 lg:hidden"
            aria-label="Ẩn menu"
            onClick={onClose}
          >
            <MaterialIcon name="menu" />
          </button>
        </div>
        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-sm">
          {links.map((item) => {
            const isActive =
              pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-md rounded-lg px-md py-sm font-label-md text-label-md transition-colors duration-200 ${
                  isActive
                    ? "border-l-4 border-secondary bg-secondary-container font-bold text-on-secondary-container"
                    : "text-on-primary/80 hover:bg-on-primary/10"
                }`}
              >
                <MaterialIcon name={item.icon} filled={isActive} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
