import { NavLink } from "react-router-dom";

export default function SidebarItem({ item, isExpanded, onClick }) {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) => `
        relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-sm font-medium transition-colors duration-200 overflow-hidden group
        ${isActive 
          ? "bg-white/10 text-white" 
          : "text-white/80 hover:bg-white/5 hover:text-white"
        }
      `}
      title={!isExpanded ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-md" />
          )}
          
          <span 
            className={`whitespace-nowrap transition-all duration-300 pl-[38px] ${
              isExpanded ? "opacity-100 w-auto ml-1" : "opacity-0 w-0 ml-0"
            }`}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}
