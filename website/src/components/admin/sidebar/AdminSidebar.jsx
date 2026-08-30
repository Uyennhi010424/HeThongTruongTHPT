import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarGroup from "./SidebarGroup";
import { ADMIN_NAV } from "../../../config/adminNav";
import { useTheme } from "../../../contexts/ThemeContext";

export default function AdminSidebar({ isMobileOpen, onMobileClose, onPanelStateChange, isDesktopExpanded, onDesktopExpandedChange, navItems = ADMIN_NAV, basePath = "/admin" }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [activeGroupId, setActiveGroupId] = useState(navItems?.[0]?.id);
  const isExpanded = isDesktopExpanded;
  const sidebarRef = useRef(null);
  const { themeLogo } = useTheme();

  // Sync active group based on URL
  useEffect(() => {
    let foundGroup = null;
    for (const group of navItems) {
      if (group.path && (pathname === group.path || pathname.startsWith(`${group.path}/`))) {
        foundGroup = group.id;
        break;
      }
      if (group.children?.some(c => pathname === c.path || pathname.startsWith(`${c.path}/`))) {
        foundGroup = group.id;
        break;
      }
    }
    if (foundGroup) {
      setActiveGroupId(foundGroup);
    }
  }, [pathname]);

  // Inform Layout of width changes
  useEffect(() => {
    onPanelStateChange?.(isExpanded);
  }, [isExpanded, onPanelStateChange]);

  const handleGroupClick = (groupId) => {
    if (activeGroupId === groupId) {
      // Toggle accordion by clearing active group
      setActiveGroupId(null);
    } else {
      // Switch group and open accordion
      setActiveGroupId(groupId);
      // Ensure sidebar is expanded when clicking a group
      if (!isExpanded && window.innerWidth >= 1024) {
        onDesktopExpandedChange(true);
      }
    }
  };

  // User requested to only collapse when clicking the menu, so removed the click-outside-to-collapse logic.

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar Container */}
      <aside 
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen z-50 bg-primary shadow-2xl transition-all duration-250 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col overflow-hidden print-hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isExpanded || isMobileOpen ? 'w-[250px]' : 'w-[72px]'
        }`}
      >
        <div className={`h-20 flex items-center border-b border-white/10 flex-shrink-0 transition-all duration-250 ${isExpanded || isMobileOpen ? 'px-6' : 'px-0 justify-center'}`}>
          <div className={`flex items-center cursor-pointer transition-all duration-250 w-full ${!isExpanded && !isMobileOpen ? 'justify-center' : ''}`} onClick={() => { 
            setActiveGroupId('dashboard'); 
            if (window.innerWidth >= 1024) onDesktopExpandedChange(true); 
            navigate(`${basePath}/dashboard`); 
          }}>
            <div className="flex-shrink-0 flex items-center justify-center w-full">
              <img 
                src={themeLogo} 
                alt="Logo Edu Manager" 
                className={`w-auto object-contain transition-all duration-250 drop-shadow-sm brightness-0 invert opacity-95 ${isExpanded || isMobileOpen ? 'h-[90px]' : 'h-[56px] w-[56px]'}`}
                style={(!isExpanded && !isMobileOpen) ? { objectPosition: 'center' } : {}}
              />
            </div>
          </div>
        </div>

        {/* Menu Items Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 px-2 flex flex-col gap-0.5">
          {navItems.map(group => (
            <SidebarGroup
              key={group.id}
              group={group}
              isExpanded={isExpanded || isMobileOpen}
              isActive={activeGroupId === group.id}
              onClick={() => handleGroupClick(group.id)}
              onLinkClick={() => {
                if (window.innerWidth < 1024) onMobileClose();
              }}
            />
          ))}
        </div>
      </aside>
    </>
  );
}
