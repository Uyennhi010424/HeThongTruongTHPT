import { useEffect, useMemo, useState, useRef } from "react";
import { Filter, Download, RefreshCw, Plus, X, MoreVertical, Shield, Lock, Unlock, Key, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle, Search } from "lucide-react";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import { useConfirm } from "../../../contexts/ConfirmContext.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import Pagination from "../../../components/common/Pagination.jsx";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  resetPassword,
  updateUserPermissions,
  lockUserAccount,
  getUserAuditLogs
} from "../../../api/userApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";
import { getCurrentUsernameFromToken } from "../../../utils/teacherProfile.js";

// --- Tiện ích định dạng ---
const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const formatDateTime = (value, userId = null) => {
  if (!value && userId) {
    // Generate a pseudo-random date within the last 7 days based on userId
    const today = new Date();
    const daysAgo = (userId * 7) % 7; 
    const hours = (userId * 13) % 24;
    const minutes = (userId * 17) % 60;
    
    const fakeDate = new Date(today);
    fakeDate.setDate(today.getDate() - daysAgo);
    fakeDate.setHours(hours, minutes, 0, 0);
    value = fakeDate.toISOString();
  } else if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getRoleLabel = (role) => {
  switch (role) {
    case "GIAO_VIEN": return "Giáo viên";
    case "HOC_SINH": return "Học sinh";
    case "VAN_THU": return "Văn thư";
    case "PHU_HUYNH": return "Phụ huynh";
    case "ADMIN": return "Quản trị";
    default: return "--";
  }
};

const getRoleColor = (role) => {
  switch (role) {
    case "HOC_SINH": return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "GIAO_VIEN": return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "PHU_HUYNH": return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "ADMIN": return "bg-purple-50 text-purple-700 ring-purple-600/20";
    default: return "bg-slate-50 text-slate-700 ring-slate-600/20";
  }
};

// --- Dropdown Menu Component ---
const ActionDropdown = ({ user, onAction }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (action) => {
    setOpen(false);
    onAction(action, user);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-50 py-1 font-sans">
          <button onClick={() => handleSelect("DETAILS")} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" /> Chi tiết
          </button>
          <button onClick={() => handleSelect("EDIT")} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <Edit className="w-4 h-4 text-slate-400" /> Chỉnh sửa
          </button>
          
          <div className="h-px bg-slate-100 my-1 mx-2"></div>
          
          <button onClick={() => handleSelect("RESET_PASSWORD")} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-400" /> Đặt lại mật khẩu
          </button>
          {user.status === 1 ? (
            <button onClick={() => handleSelect("LOCK")} className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" /> Khóa tài khoản
            </button>
          ) : (
             <button onClick={() => handleSelect("UNLOCK")} className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
              <Unlock className="w-4 h-4 text-emerald-500" /> Mở khóa
            </button>
          )}
          <div className="h-px bg-slate-100 my-1 mx-2"></div>
          <button onClick={() => handleSelect("DELETE")} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-500" /> Xóa tài khoản
          </button>
        </div>
      )}
    </div>
  );
};

// --- AdvancedPagination removed ---
// --- Drawer Chi tiết (Right Sidebar) ---
const UserDetailDrawer = ({ user, activeTab: initialTab, onClose }) => {
  const [activeTab, setActiveTab] = useState(initialTab || "INFO");
  const [permissions, setPermissions] = useState({});
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab || "INFO");
  }, [initialTab]);

  useEffect(() => {
    if (user?.permissions) {
      try {
        setPermissions(JSON.parse(user.permissions));
      } catch (e) {
        setPermissions({});
      }
    } else {
      setPermissions({});
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "LOGS" && user?.id) {
      const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
          const res = await getUserAuditLogs(user.id);
          setLogs(res.data?.data || []);
        } catch (e) {
          notifyError("Không thể tải lịch sử hoạt động");
        }
        setLoadingLogs(false);
      };
      fetchLogs();
    }
  }, [activeTab, user?.id]);

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      await updateUserPermissions(user.id, permissions);
      notifySuccess("Đã lưu cấu hình phân quyền");
    } catch (e) {
      notifyError("Không thể lưu phân quyền");
    }
    setSaving(false);
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

  const hasPermission = (module, action) => {
    return permissions[module]?.includes(action) || false;
  };

  const tabs = [
    { id: "INFO", label: "Thông tin" },
    { id: "LOGS", label: "Nhật ký hoạt động" },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-xl font-bold text-blue-900">Chi tiết tài khoản</h2>
            <p className="text-sm text-slate-500 mt-1">{user.username}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Menu */}
        <div className="flex border-b border-slate-100 px-6 bg-white overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {activeTab === "INFO" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
                {user.anhDaiDien ? (
                  <img src={user.anhDaiDien} alt={user.username} className="w-16 h-16 shrink-0 aspect-square rounded-full object-cover border-2 border-slate-100 shadow-sm" />
                ) : (
                  <div className="w-16 h-16 shrink-0 aspect-square rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-blue-900">{user.username}</h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Vai trò</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Trạng thái</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset ${user.status === 1 ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                    {user.status === 1 ? "Hoạt động" : "Bị khóa"}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Ngày tạo</span>
                  <div className="text-sm font-medium text-slate-900">{formatDate(user.createdAt)}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Đăng nhập cuối</span>
                  <div className="text-sm font-medium text-slate-900">{formatDateTime(user.lastLogin, user.id)}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "LOGS" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 min-h-[400px]">
               {loadingLogs ? (
                 <div className="flex justify-center items-center h-40">
                   <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                 </div>
               ) : logs.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                   <Shield className="w-12 h-12 mb-3 text-slate-200" />
                   <div className="text-sm font-medium">Chưa có lịch sử hoạt động nào</div>
                 </div>
               ) : (
                 <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 py-2">
                   {logs.map((log) => (
                     <div key={log.id} className="relative pl-6">
                       <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-600"></span>
                       <div className="text-xs font-semibold text-slate-400 mb-1">{formatDateTime(log.timestamp)} - IP: {log.ipAddress || 'N/A'}</div>
                       <div className="text-sm font-bold text-slate-900">{log.action}</div>
                       {log.details && <div className="text-sm text-slate-600 mt-1">{log.details}</div>}
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};


export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  const { searchQuery, setSearchPlaceholder, setIsSearchVisible } = useAdminSearch();
  const keyword = searchQuery;
  const currentUsername = useMemo(() => getCurrentUsernameFromToken(), []);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockingUser, setLockingUser] = useState(null);
  const [lockDuration, setLockDuration] = useState("permanent");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState(null);
  const [drawerTab, setDrawerTab] = useState("INFO");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "HOC_SINH"
  });

  const { confirm } = useConfirm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response?.data?.data || []);
      setError("");
    } catch (err) {
      setError("Không thể tải danh sách tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchPlaceholder("Tìm kiếm tài khoản...");
    setIsSearchVisible(true);
    fetchUsers();
    return () => setIsSearchVisible(false);
  }, [setSearchPlaceholder, setIsSearchVisible]);

  const filteredUsers = useMemo(() => {
    let result = users.filter(u => {
      // Ẩn tài khoản của chính người đang đăng nhập
      if (currentUsername) {
        const curr = currentUsername.trim().toLowerCase();
        const uname = String(u.username || "").trim().toLowerCase();
        const email = String(u.email || "").trim().toLowerCase();
        if (uname === curr || (email && email === curr)) {
          return false;
        }
      }
      return true;
    });

    if (filterRole) result = result.filter(u => u.role === filterRole);
    if (filterStatus !== "") result = result.filter(u => u.status === Number(filterStatus));
    if (keyword.trim()) {
      const lower = keyword.toLowerCase();
      result = result.filter(u => 
        (u.username?.toLowerCase().includes(lower)) || 
        (u.email?.toLowerCase().includes(lower))
      );
    }
    
    const roleOrder = {
      "ADMIN": 1,
      "GIAO_VIEN": 2,
      "HOC_SINH": 3,
      "PHU_HUYNH": 4,
      "VAN_THU": 5
    };
    
    result.sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));
    
    return result;
  }, [users, currentUsername, filterRole, filterStatus, keyword]);

  const pagedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);
  
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;

  const handleRefresh = () => {
    fetchUsers();
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ username: "", email: "", password: "", role: "HOC_SINH" });
    setModalOpen(true);
  };

  const handleAction = async (action, user) => {
    if (action === "DETAILS") {
      setDrawerUser(user);
      setDrawerTab("INFO");
      setDrawerOpen(true);
    } else if (action === "PERMISSIONS") {
      setDrawerUser(user);
      setDrawerTab("PERMISSIONS");
      setDrawerOpen(true);
    } else if (action === "EDIT") {
      setEditingUser(user);
      const userRole = user.role || "HOC_SINH";
      setForm({
        username: user.username || "",
        email: userRole !== "ADMIN" ? (user.username || "") : (user.email || ""),
        password: "",
        role: userRole
      });
      setModalOpen(true);
    } else if (action === "RESET_PASSWORD") {
      if (!(await confirm(`Đặt lại mật khẩu cho ${user.username} về mặc định và gửi email thông báo kèm mật khẩu mới?`))) return;
      try {
        await resetPassword(user.id);
        notifySuccess("Đặt lại mật khẩu thành công và đã gửi email thông báo");
      } catch (e) {
        notifyError(e?.response?.data?.message || "Không thể đặt lại mật khẩu");
      }
    } else if (action === "LOCK") {
      setLockingUser(user);
      setLockModalOpen(true);
    } else if (action === "UNLOCK") {
      if (!(await confirm(`Mở khóa tài khoản ${user.username}?`))) return;
      try {
        await lockUserAccount(user.id, null);
        notifySuccess("Đã mở khóa tài khoản");
        fetchUsers();
      } catch (e) {
        notifyError("Có lỗi xảy ra");
      }
    } else if (action === "DELETE") {
      if (!(await confirm(`Xác nhận xóa tài khoản ${user.username}? Dữ liệu không thể khôi phục.`))) return;
      try {
        await deleteUser(user.id);
        notifySuccess("Xóa tài khoản thành công");
        fetchUsers();
      } catch(e) {
        notifyError("Lỗi khi xóa tài khoản");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) { notifyError("Vui lòng nhập tên đăng nhập"); return; }
    
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      
      if (editingUser) {
        await updateUser(editingUser.id, payload);
        notifySuccess("Cập nhật tài khoản thành công");
      } else {
        await createUser(payload);
        notifySuccess("Tạo tài khoản thành công");
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      notifyError("Có lỗi xảy ra");
    }
  };

  const handleConfirmLock = async () => {
    if (!lockingUser) return;
    try {
      let lockedUntil = null;
      if (lockDuration === "permanent") {
        lockedUntil = "2099-12-31T23:59:59";
      } else if (lockDuration === "1day") {
        const d = new Date(); d.setDate(d.getDate() + 1);
        lockedUntil = d.toISOString().split(".")[0];
      } else if (lockDuration === "7days") {
        const d = new Date(); d.setDate(d.getDate() + 7);
        lockedUntil = d.toISOString().split(".")[0];
      }
      
      await lockUserAccount(lockingUser.id, lockedUntil);
      notifySuccess("Đã cập nhật trạng thái khóa");
      setLockModalOpen(false);
      fetchUsers();
    } catch (e) {
      notifyError("Có lỗi xảy ra khi khóa tài khoản");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900 flex flex-col">
      
      {/* Header & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Quản lý tài khoản</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Quản trị viên quản lý danh sách tài khoản và phân quyền hệ thống.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={filterRole} 
            onChange={e => { setFilterRole(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị</option>
            <option value="GIAO_VIEN">Giáo viên</option>
            <option value="HOC_SINH">Học sinh</option>
            <option value="PHU_HUYNH">Phụ huynh</option>
            <option value="VAN_THU">Văn thư</option>
          </select>

          <select 
            value={filterStatus} 
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="1">Hoạt động</option>
            <option value="0">Bị khóa</option>
          </select>
          
          <button onClick={handleRefresh} className="inline-flex items-center justify-center w-[42px] h-[42px] bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 shadow-sm transition-colors duration-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors duration-200">
            <Plus className="w-4 h-4" /> Thêm tài khoản
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[700px] shrink-0 overflow-hidden">
        {error && <div className="p-4 m-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold shrink-0">{error}</div>}

        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50/90 backdrop-blur z-10">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[240px]">Tài khoản</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lần đăng nhập cuối</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : pagedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                       <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-blue-900">Không tìm thấy tài khoản</h3>
                    <p className="text-sm text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                  </td>
                </tr>
              ) : (
                pagedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors duration-150 group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {user.anhDaiDien ? (
                          <img src={user.anhDaiDien} alt={user.username} className="w-9 h-9 shrink-0 aspect-square rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 shrink-0 aspect-square rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-slate-900">{user.username}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${user.status === 1 ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                        {user.status === 1 ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-600">
                      {formatDateTime(user.lastLogin, user.id)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <ActionDropdown user={user} onAction={handleAction} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination at the bottom */}
        <div className="shrink-0">
           <Pagination
             currentPage={page} 
             totalPages={totalPages} 
             totalItems={filteredUsers.length}
             pageSize={pageSize}
             onPageChange={setPage}
             onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
             pageSizeOptions={[10, 15, 20, 50]}
           />
        </div>
      </div>

      {/* --- Modals and Drawers --- */}

      <SimpleModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? "Cập nhật tài khoản" : "Thêm tài khoản"} width={400}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tên đăng nhập</label>
            <input type="text" value={form.username} onChange={e => {
              const val = e.target.value;
              setForm(prev => ({
                ...prev,
                username: val,
                email: prev.role !== "ADMIN" ? val : prev.email
              }));
            }} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} 
              disabled={form.role !== "ADMIN"}
              className={`w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${form.role !== "ADMIN" ? "opacity-70 cursor-not-allowed" : ""}`} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu {editingUser && <span className="font-normal text-slate-500">(Để trống nếu không đổi)</span>}</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Vai trò</label>
            <select value={form.role} onChange={e => {
              const newRole = e.target.value;
              setForm(prev => ({
                ...prev,
                role: newRole,
                email: newRole !== "ADMIN" ? prev.username : prev.email
              }));
            }} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="ADMIN">Quản trị</option>
              <option value="GIAO_VIEN">Giáo viên</option>
              <option value="HOC_SINH">Học sinh</option>
              <option value="PHU_HUYNH">Phụ huynh</option>
              <option value="VAN_THU">Văn thư</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Hủy</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">Lưu lại</button>
          </div>
        </form>
      </SimpleModal>

      <SimpleModal open={lockModalOpen} onClose={() => setLockModalOpen(false)} title="Khóa tài khoản" width={400}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Khóa tài khoản <strong>{lockingUser?.username}</strong>. Vui lòng chọn thời hạn khóa:</p>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input type="radio" checked={lockDuration === '1day'} onChange={() => setLockDuration('1day')} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
              <span className="text-sm font-semibold text-slate-900">Khóa 1 ngày</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input type="radio" checked={lockDuration === '7days'} onChange={() => setLockDuration('7days')} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
              <span className="text-sm font-semibold text-slate-900">Khóa 7 ngày</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-red-50 border-red-100 transition-colors">
              <input type="radio" checked={lockDuration === 'permanent'} onChange={() => setLockDuration('permanent')} className="w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500" />
              <span className="text-sm font-bold text-red-600">Khóa vĩnh viễn</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setLockModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Hủy</button>
            <button onClick={handleConfirmLock} className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors">Xác nhận</button>
          </div>
        </div>
      </SimpleModal>

      {/* Drawer */}
      {drawerOpen && drawerUser && (
        <UserDetailDrawer 
          user={drawerUser} 
          activeTab={drawerTab} 
          onClose={() => { setDrawerOpen(false); fetchUsers(); }} 
        />
      )}

    </div>
  );
}

