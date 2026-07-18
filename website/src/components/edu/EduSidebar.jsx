import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

/**
 * Sidebar hỗ trợ 2 kiểu dữ liệu:
 * 1. Flat: links = [{ path, label, icon }, ...]
 * 2. Grouped: links = [{ group: "Tên nhóm", children: [{ path, label, icon }, ...] }, ...]
 */
export default function EduSidebar({
  links,
  title = "EduManager Pro",
  subtitle = "Hệ thống quản lý giáo dục",
  isOpen = false,
  onClose,
  navClassName = "space-y-1"
}) {
  const { pathname } = useLocation();
  // Mixed nav: some items are flat (have path), some are grouped (have group+children)
  const hasGroupedItems = links.some((item) => item.group != null);
  const hasFlatItems = links.some((item) => item.path != null && item.group == null);
  const isMixed = hasGroupedItems && hasFlatItems;
  const isGrouped = hasGroupedItems;

  // Auto-expand group containing active link
  const [expandedGroups, setExpandedGroups] = useState(() => {
    if (!isGrouped) return {};
    const init = {};
    links.forEach((g) => {
      const hasActive = g.children?.some(
        (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
      );
      init[g.group] = hasActive;
    });
    return init;
  });

  // Expand group when route changes
  useEffect(() => {
    if (!isGrouped) return;
    setExpandedGroups((prev) => {
      const next = { ...prev };
      links.forEach((g) => {
        const hasActive = g.children?.some(
          (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
        );
        if (hasActive) next[g.group] = true;
      });
      return next;
    });
  }, [pathname, isGrouped, links]);

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const renderLink = (item) => {
    const isActive =
      pathname === item.path || pathname.startsWith(`${item.path}/`);
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onClose}
        className={`flex min-h-10 items-center gap-3 rounded-lg px-4 py-2 font-label-md text-label-md transition-colors duration-150 ${
          isActive
            ? "border-l-4 border-white bg-white/20 font-bold text-white"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        }`}
      >
        {item.icon && (
          <span className="material-symbols-outlined text-[20px] opacity-80">
            {item.icon}
          </span>
        )}
        <span>{item.label}</span>
      </Link>
    );
  };

  const renderGroupedNav = () => (
    <div className="flex flex-col gap-1">
      {links.filter((g) => g.group != null).map((group) => {
        const expanded = expandedGroups[group.group];
        const hasActiveChild = group.children?.some(
          (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
        );

        return (
          <div key={group.group}>
            <button
              type="button"
              onClick={() => toggleGroup(group.group)}
              className={`flex w-full min-h-10 items-center justify-between rounded-lg px-4 py-2 text-left font-label-md text-label-md transition-colors duration-150 ${
                hasActiveChild
                  ? "text-white font-semibold"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="uppercase tracking-wider text-[11px] font-bold opacity-90">
                {group.group}
              </span>
              <span
                className="material-symbols-outlined text-[18px] transition-transform duration-200"
                style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                expand_more
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-200"
              style={{
                maxHeight: expanded ? `${(group.children?.length || 0) * 48}px` : "0px",
                opacity: expanded ? 1 : 0
              }}
            >
              <div className="ml-2 flex flex-col gap-0.5 border-l border-white/20 pl-2">
                {group.children?.map(renderLink)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        id="admin-sidebar"
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] -translate-x-full flex-col bg-primary py-md transition-transform duration-200 ${
          isOpen ? "translate-x-0 shadow-lg" : ""
        }`}
        aria-label="Điều hướng quản trị"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-xl flex items-start justify-between gap-md px-lg">
          <div>
            <h1 className="text-headline-md font-bold text-white">{title}</h1>
            <p className="text-label-sm text-white/70">{subtitle}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 lg:hidden"
            aria-label="Ẩn menu"
            onClick={onClose}
          >
            <span className="text-lg font-medium leading-none">&times;</span>
          </button>
        </div>
        <nav className={`custom-scrollbar flex-1 overflow-y-auto px-sm ${navClassName}`}>
          {isGrouped ? (
            <>
              {/* Flat items first (e.g. Dashboard) */}
              {isMixed && links.filter((item) => item.group == null).map(renderLink)}
              {/* Then grouped items */}
              {renderGroupedNav()}
            </>
          ) : (
            links.map(renderLink)
          )}
        </nav>
      </aside>
    </>
  );
}
