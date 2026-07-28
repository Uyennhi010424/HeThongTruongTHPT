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
        onClick={() => {
          if (window.innerWidth < 1024) onClose();
        }}
        className={`group relative flex min-h-10 items-center rounded-lg py-1.5 my-0.5 transition-all duration-300 ease-out overflow-hidden ${
          isOpen ? "gap-2.5 px-3 font-label-md text-label-md mx-2" : "justify-center px-0 lg:mx-2 lg:mb-1"
        } ${
          isActive
            ? "bg-white/10 font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] backdrop-blur-sm border border-white/10"
            : "text-white/70 hover:bg-white/5 hover:text-white"
        }`}
        title={!isOpen ? item.label : undefined}
      >
        {/* Active Indicator Line */}
        {isActive && isOpen && (
          <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-white opacity-90 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        )}
        
        {item.icon && (
          <span className={`material-symbols-outlined transition-all duration-300 ${isOpen ? "text-[18px]" : "text-[22px]"} ${isActive ? "opacity-100 scale-110" : "opacity-80 group-hover:scale-110 group-hover:opacity-100"}`}>
            {item.icon}
          </span>
        )}
        <span className={`transition-opacity duration-300 whitespace-nowrap ${isOpen ? "opacity-100" : "opacity-0 hidden"}`}>{item.label}</span>
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
          <div key={group.group} className={!isOpen ? "mt-2 border-t border-white/10 pt-2 relative group/popout" : ""}>
            {isOpen ? (
              <>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.group)}
                  className={`group flex w-full min-h-10 items-center justify-between rounded-lg px-3 py-1.5 mx-2 text-left font-label-md text-label-md transition-all duration-300 ease-out ${
                    hasActiveChild
                      ? "text-white font-semibold bg-white/5"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="uppercase tracking-wider text-[11px] font-bold opacity-90 transition-opacity group-hover:opacity-100">
                    {group.group}
                  </span>
                  <span
                    className="material-symbols-outlined text-[18px] transition-transform duration-300 ease-in-out group-hover:scale-110"
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
                  <div className="flex flex-col gap-0.5 ml-2 border-l border-white/20 pl-2">
                    {group.children?.map(renderLink)}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Minimized Group Icon */}
                <div className={`flex min-h-10 items-center justify-center rounded-lg lg:mx-2 lg:mb-1 cursor-pointer transition-all duration-300 ${hasActiveChild ? "bg-white/10 text-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-white/10" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                  <span className="material-symbols-outlined text-[22px]">{group.icon || "folder"}</span>
                </div>
                {/* Popout Menu */}
                <div className="absolute left-full top-0 ml-2 hidden w-48 flex-col rounded-xl bg-[#0f4a8a] border border-white/10 p-2 shadow-xl opacity-0 group-hover/popout:flex group-hover/popout:opacity-100 transition-all duration-300 z-50">
                   <div className="px-3 py-2 text-[10px] font-bold text-white/50 uppercase tracking-wider">{group.group}</div>
                   {group.children?.map((item) => {
                     const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                     return (
                       <Link
                         key={item.path}
                         to={item.path}
                         className={`flex items-center gap-3 rounded-lg px-3 py-2 my-0.5 text-sm transition-all duration-200 ${
                           isActive
                             ? "bg-white/20 font-bold text-white"
                             : "text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1"
                         }`}
                       >
                         {item.icon && <span className="material-symbols-outlined text-[18px]">{item.icon}</span>}
                         <span>{item.label}</span>
                       </Link>
                     );
                   })}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        id="admin-sidebar"
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col bg-gradient-to-b from-primary to-[#0f4a8a] py-md transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isOpen
            ? "w-[250px] translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.15)]"
            : "w-[250px] -translate-x-full lg:w-[80px] lg:translate-x-0 shadow-none lg:shadow-[2px_0_12px_rgba(0,0,0,0.05)]"
        }`}
        aria-label="Điều hướng quản trị"
        role="dialog"
        aria-modal="true"
      >
        <div className={`flex items-start justify-end gap-md ${isOpen ? "px-lg mb-6" : "px-0 lg:justify-center mb-6"}`}>

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
