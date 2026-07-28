import { ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import SidebarItem from "./SidebarItem";

export default function SidebarGroup({ group, isExpanded, isActive, onClick, onLinkClick }) {
  const Icon = group.icon;
  const location = useLocation();

  if (group.path) {
    const isLinkActive = location.pathname === group.path || location.pathname.startsWith(`${group.path}/`);
    return (
      <div className="flex flex-col overflow-hidden">
        <Link
          to={group.path}
          onClick={(e) => {
            if (isLinkActive) {
              e.preventDefault();
              onClick();
            }
            if (onLinkClick) onLinkClick();
          }}
          className={`relative flex items-center justify-between w-full py-1.5 px-2 rounded-xl transition-colors duration-200 group ${
            isLinkActive && !isExpanded ? "bg-white/10" : "hover:bg-white/5"
          }`}
          title={!isExpanded ? group.group : undefined}
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-colors duration-200">
              <Icon 
                className={`w-[22px] h-[22px] transition-colors duration-200 ${
                  isLinkActive ? "text-white" : "text-white/60 group-hover:text-white"
                }`} 
                strokeWidth={isLinkActive ? 2.5 : 2}
              />
            </div>
            
            <div 
              className={`flex items-center transition-all duration-250 ease-out whitespace-nowrap overflow-hidden ${
                isExpanded ? "w-[160px] opacity-100 ml-3" : "w-0 opacity-0 ml-0"
              }`}
            >
              <span className={`text-[12px] uppercase tracking-wider font-bold mb-0.5 transition-colors ${isLinkActive ? "text-white" : "text-white/55 group-hover:text-white/90"}`}>
                {group.group}
              </span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  
  return (
    <div className="flex flex-col overflow-hidden">
      <button
        onClick={onClick}
        className={`relative flex items-center justify-between w-full py-1.5 px-2 rounded-xl transition-colors duration-200 group ${
          isActive && !isExpanded ? "bg-white/10" : "hover:bg-white/5"
        }`}
        title={!isExpanded ? group.group : undefined}
      >
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-colors duration-200">
            <Icon 
              className={`w-[22px] h-[22px] transition-colors duration-200 ${
                isActive ? "text-white" : "text-white/60 group-hover:text-white"
              }`} 
              strokeWidth={isActive ? 2.5 : 2}
            />
          </div>
          
          <div 
            className={`flex flex-col items-start transition-all duration-250 ease-out whitespace-nowrap overflow-hidden ${
              isExpanded ? "w-[160px] opacity-100 ml-3" : "w-0 opacity-0 ml-0"
            }`}
          >
            <span className={`text-[10px] uppercase tracking-wider font-bold mb-0.5 transition-colors ${isActive ? "text-white" : "text-white/55 group-hover:text-white/90"}`}>
              {group.group}
            </span>
          </div>
        </div>
        
        {isExpanded && (
          <ChevronDown 
            className={`w-4 h-4 mr-2 transition-transform duration-300 flex-shrink-0 ${
              isActive ? "rotate-180 text-white" : "rotate-0 text-white/40 group-hover:text-white/70"
            }`} 
          />
        )}
      </button>

      {/* Accordion Submenu */}
      <div 
        className={`grid transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isExpanded && isActive ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden flex flex-col gap-1">
          {group.children?.map(child => (
            <SidebarItem 
              key={child.path} 
              item={child} 
              isExpanded={isExpanded} 
              onClick={onLinkClick} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

