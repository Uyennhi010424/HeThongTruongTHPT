const fs = require('fs');

const path = './website/src/components/edu/EduTopBar.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace imports
content = content.replace(
  `import MaterialIcon from "./MaterialIcon.jsx";`,
  `import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Lock
} from "lucide-react";`
);

// We need to insert searchQuery state and handleSearch function just before `const dynamicStyle = ...`
const insertionPoint = `const dynamicStyle = sidebarWidth !== undefined ? {`;
const logicToInsert = `
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(\`/search?q=\${encodeURIComponent(searchQuery.trim())}\`);
    }
  };

  `;

content = content.replace(insertionPoint, logicToInsert + insertionPoint);

// Replace the return statement
const splitRegex = /return\s*\(\s*<header/;
const parts = content.split(splitRegex);

if (parts.length < 2) {
  console.error("Could not find the return block!");
  process.exit(1);
}

const logicCode = parts[0];

const newJSX = `return (
    <header 
      className={\`fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] \${sidebarWidth === undefined ? (!navLinks ? (isOpen ? "lg:left-[250px] lg:w-[calc(100%-250px)]" : "lg:left-[80px] lg:w-[calc(100%-80px)]") : "lg:left-0 lg:w-full") : ""}\`}
      style={dynamicStyle}
    >
      <div className="flex items-center gap-4">
        {/* Hamburger button */}
        <button
          type="button"
          className="group flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all duration-300 ease-out hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-label={isOpen ? "Đóng menu" : "Mở menu"}
          onClick={onToggle}
        >
          <Menu className={\`w-5 h-5 text-slate-700 transition-transform duration-300 group-hover:scale-110 \${!isOpen && !navLinks ? "rotate-90" : ""}\`} />
        </button>

        {/* Logo */}
        {(() => {
          const targetPath = currentRole === "ADMIN" ? "/admin/dashboard" : currentRole === "TEACHER" ? "/teacher/dashboard" : currentRole === "STUDENT" ? "/student/home" : currentRole === "PARENT" ? "/parent/home" : "/";
          return (
            <Link 
              to={targetPath} 
              onClick={(e) => {
                if (pathname === targetPath) {
                  e.preventDefault();
                  window.location.reload();
                }
              }}
              className="flex items-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              title="Về trang tổng quan"
            >
              <img src="/logo.png" alt="Logo Edu Manager" className="h-[32px] w-auto object-contain" />
            </Link>
          );
        })()}

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center relative ml-4">
          <div className="absolute left-3 text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-[280px] h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />
        </form>
      </div>

      {/* Navigation links in header (Middle) */}
      {navLinks && (
        <nav className="hidden lg:flex items-center justify-center gap-7 flex-1 mx-4">
          {navLinks.map((item, idx) => {
            // Flat link
            if (item.path) {
              const isActive = pathname === item.path || pathname.startsWith(\`\${item.path}/\`);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={\`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[15px] font-medium whitespace-nowrap transition-colors duration-200 \${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 bg-transparent hover:bg-slate-100"
                  }\`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            }

            // Grouped link with dropdown
            if (item.group) {
              const hasActiveChild = item.children?.some(
                (child) => pathname === child.path || pathname.startsWith(\`\${child.path}/\`)
              );
              const isDropdownOpen = openGroup === item.group;

              return (
                <div key={item.group} className="relative" ref={(el) => { groupRefsMap.current[item.group] = el; }}>
                  <button
                    type="button"
                    onClick={() => setOpenGroup(isDropdownOpen ? null : item.group)}
                    className={\`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[15px] font-medium whitespace-nowrap transition-colors duration-200 \${
                      hasActiveChild
                        ? "text-blue-600"
                        : "text-slate-600 bg-transparent hover:bg-slate-100"
                    }\`}
                  >
                    <span>{item.group}</span>
                    <ChevronDown size={16} className={\`transition-transform duration-200 \${isDropdownOpen ? "rotate-180" : ""}\`} />
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className={\`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[220px] rounded-xl bg-white border border-slate-100 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all duration-200 origin-top \${
                      isDropdownOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                    }\`}
                  >
                    <div className="py-2 flex flex-col gap-0.5">
                      {item.children?.map((child) => {
                        const isChildActive = pathname === child.path || pathname.startsWith(\`\${child.path}/\`);
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setOpenGroup(null)}
                            className={\`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors duration-150 \${
                              isChildActive
                                ? "bg-blue-50 text-blue-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                            }\`}
                          >
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </nav>
      )}

      {/* Right section: Notifications & Account */}
      <div className="flex items-center gap-4 shrink-0">
        
        {/* Notifications */}
        <div className="relative" ref={notiRef}>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors duration-200 hover:bg-slate-100 focus:outline-none"
            onClick={() => setNotiOpen(!notiOpen)}
            aria-label="Thông báo"
          >
            <Bell size={20} className={\`transition-transform duration-300 \${notiOpen ? "rotate-[15deg]" : ""}\`} />
            {notices.length > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* Noti Dropdown */}
          <div
            className={\`absolute right-0 top-full mt-2 w-80 md:w-96 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all duration-200 origin-top-right \${
              notiOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
            }\`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="font-bold text-slate-800">Thông báo</h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
              {notices.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 font-medium">Không có thông báo mới</div>
              ) : (
                notices.map((n) => (
                  <div key={n.id} className="flex flex-col gap-1 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                    <span className="text-sm font-semibold text-slate-800 line-clamp-2">{n.tieuDe}</span>
                    <span className="text-xs text-slate-500 font-medium">{formatDate(n.ngayDang)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Account Dropdown */}
        <div className="relative" ref={accountRef}>
          <button
            type="button"
            className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 transition-colors duration-200 hover:bg-slate-50 border border-transparent hover:border-slate-200 focus:outline-none"
            onClick={() => setAccountOpen(!accountOpen)}
            aria-label="Tài khoản"
          >
            <img
              src={avatar}
              alt="Avatar"
              className="h-10 w-10 rounded-full object-cover shadow-sm border border-slate-200 bg-white"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://ui-avatars.com/api/?name=U&background=random";
              }}
            />
            <div className="hidden flex-col items-start md:flex">
              <span className="text-sm font-semibold text-slate-800 line-clamp-1">{userName}</span>
              <span className="text-xs font-medium text-slate-500">{userRole}</span>
            </div>
          </button>

          <div
            className={\`absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all duration-200 origin-top-right \${
              accountOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
            }\`}
          >
            <div className="flex items-center gap-3 border-b border-slate-100 p-4">
              <img
                src={avatar}
                alt="Avatar"
                className="h-12 w-12 rounded-full object-cover shadow-sm border border-slate-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://ui-avatars.com/api/?name=U&background=random";
                }}
              />
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 line-clamp-1">{userName}</span>
                <span className="text-xs font-medium text-slate-500">{userRole}</span>
              </div>
            </div>
            
            <div className="p-2 flex flex-col gap-1">
              {!hideEdit && (
                <>
                  <Link
                    to={\`\${resolveBasePath()}/profile\`}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    onClick={() => setAccountOpen(false)}
                  >
                    <UserIcon size={18} className="text-slate-400" />
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    to={\`\${resolveBasePath()}/profile/change-password\`}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    onClick={() => setAccountOpen(false)}
                  >
                    <Lock size={18} className="text-slate-400" />
                    Đổi mật khẩu
                  </Link>
                  <div className="h-px bg-slate-100 my-1"></div>
                </>
              )}
              <button
                type="button"
                className="flex items-center w-full gap-3 px-3 py-2 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
`;

fs.writeFileSync(path, logicCode + newJSX);
console.log('Successfully updated EduTopBar.jsx');
