import { useState, useEffect, useRef } from "react";
import { getRoleConfigs, updateRolePermissions } from "../../../api/roleApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

const ROLES = [
  { id: "ADMIN", label: "Quản trị", color: "bg-purple-50 text-purple-700 ring-purple-600/20" },
  { id: "GIAO_VIEN", label: "Giáo viên", color: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  { id: "HOC_SINH", label: "Học sinh", color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  { id: "PHU_HUYNH", label: "Phụ huynh", color: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  { id: "VAN_THU", label: "Văn thư", color: "bg-slate-50 text-slate-700 ring-slate-600/20" }
];

const MODULES = [
  "Dashboard", "Tài khoản", "Học sinh", "Giáo viên", "Lớp học",
  "Điểm", "Hạnh kiểm", "Khen thưởng", "Kỷ luật", "Thời khóa biểu",
  "Thông báo", "AI", "Backup", "Cấu hình hệ thống"
];

const ACTIONS = ["Xem", "Thêm", "Sửa", "Xóa"];

export default function RolePermissionManager() {
  const [activeRole, setActiveRole] = useState("ADMIN");
  const [configs, setConfigs] = useState({});
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await getRoleConfigs();
      const data = res.data?.data || [];
      const configMap = {};
      data.forEach(item => {
        try {
          configMap[item.role] = item.permissions ? JSON.parse(item.permissions) : {};
        } catch (e) {
          configMap[item.role] = {};
        }
      });
      setConfigs(configMap);
    } catch (e) {
      console.error(e);
      notifyError("Không thể tải cấu hình quyền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (configs[activeRole]) {
      setPermissions(configs[activeRole]);
    } else {
      setPermissions({});
    }
  }, [activeRole, configs]);

  const hasPermission = (module, action) => {
    return permissions[module]?.includes(action) || false;
  };

  const handlePermissionChange = (module, action, checked) => {
    setPermissions(prev => {
      const newPerms = { ...prev };
      if (!newPerms[module]) newPerms[module] = [];
      if (checked) {
        if (!newPerms[module].includes(action)) newPerms[module].push(action);
      } else {
        newPerms[module] = newPerms[module].filter(a => a !== action);
      }
      return newPerms;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRolePermissions(activeRole, permissions);
      notifySuccess(`Đã lưu cấu hình quyền cho ${ROLES.find(r => r.id === activeRole)?.label}`);
      // Cập nhật lại configMap local
      setConfigs(prev => ({ ...prev, [activeRole]: permissions }));
    } catch (e) {
      notifyError("Lỗi khi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px] mt-8">
      {/* Container chính (đã bỏ cột trái) */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-blue-900">Quyền truy cập:</h3>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`inline-flex items-center justify-between min-w-[140px] px-3 py-1.5 rounded-lg text-sm font-bold ring-1 ring-inset cursor-pointer transition-all hover:opacity-90 ${ROLES.find(r => r.id === activeRole)?.color}`}
                >
                  <span>{ROLES.find(r => r.id === activeRole)?.label}</span>
                  <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 mt-2 w-[180px] bg-white rounded-xl shadow-xl border border-slate-100 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {ROLES.map(role => (
                      <button
                        key={role.id}
                        onClick={() => {
                          setActiveRole(role.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors flex items-center justify-between ${activeRole === role.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                      >
                        <span>{role.label}</span>
                        {activeRole === role.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">Cấu hình các chức năng mà vai trò này được phép truy cập.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <span className="text-slate-400">Đang tải...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header của bảng */}
              <div className="grid grid-cols-[250px_1fr] gap-8 mb-2 px-4">
                <div className="text-xs font-bold text-slate-500 uppercase">Module</div>
                <div className="flex items-center gap-12 text-xs font-bold text-slate-500 uppercase">
                  {ACTIONS.map(a => <span key={a} className="w-16 text-center">{a}</span>)}
                </div>
              </div>

              {/* Dữ liệu của bảng */}
              {MODULES.map(mod => (
                <div key={mod} className="grid grid-cols-[250px_1fr] gap-8 p-4 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <div className="font-semibold text-sm text-slate-800 flex items-center">{mod}</div>
                  <div className="flex items-center gap-12">
                    {ACTIONS.map(action => (
                      <label key={action} className="w-16 flex justify-center cursor-pointer group">
                        <div className="relative flex items-center justify-center p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={hasPermission(mod, action)}
                            onChange={(e) => handlePermissionChange(mod, action, e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 cursor-pointer transition-all"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
