import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser
} from "../../../api/userApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const getStatusLabel = (status) => (status === 1 ? "Hoạt động" : "Tạm khóa");

const getRoleLabel = (role) => {
  switch (role) {
    case "GIAO_VIEN":
      return "Giáo viên";
    case "HOC_SINH":
      return "Học sinh";
    case "VAN_THU":
      return "Văn thư";
    case "PHU_HUYNH":
      return "Phụ huynh";
    case "ADMIN":
      return "Quản trị";
    default:
      return "--";
  }
};

const getRoleClassName = (role) => {
  switch (role) {
    case "HOC_SINH":
      return "role-hocsinh";
    case "GIAO_VIEN":
      return "role-giaovien";
    case "PHU_HUYNH":
      return "role-phuhuynh";
    default:
      return "";
  }
};

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    status: 1,
    role: "HOC_SINH"
  });
  const [formError, setFormError] = useState("");

  const fetchUsers = async ({ silent = false } = {}) => {
    const shouldShowError = !silent;
    try {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      const response = await getUsers();
      const data = response?.data?.data || [];
      const sorted = [...data].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));
      setUsers(sorted);
    } catch (err) {
      if (shouldShowError || users.length === 0) {
        setError("Không thể tải danh sách tài khoản.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let active = true;

    const fetchUsersSafe = async (options = {}) => {
      if (!active) return;
      await fetchUsers(options);
    };

    fetchUsersSafe();

    const handleUsersUpdated = () => {
      fetchUsersSafe({ silent: true });
    };

    const handleStorage = (event) => {
      if (event.key === "usersUpdatedAt") {
        fetchUsersSafe({ silent: true });
      }
    };

    const handleWindowFocus = () => {
      fetchUsersSafe({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUsersSafe({ silent: true });
      }
    };

    const refreshTimer = window.setInterval(() => {
      fetchUsersSafe({ silent: true });
    }, 30000);

    window.addEventListener("users-updated", handleUsersUpdated);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener("users-updated", handleUsersUpdated);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const activeCount = users.filter((user) => user.status === 1).length;
    const lockedCount = total - activeCount;
    return { total, activeCount, lockedCount };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const byRole =
      roleFilter === "all" ? users : users.filter((user) => user.role === roleFilter);

    if (!keyword.trim()) return byRole;
    const lower = keyword.toLowerCase();
    return byRole.filter((user) =>
      [user.username, user.email]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower))
    );
  }, [keyword, users, roleFilter]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  }, [filteredUsers.length, pageSize]);

  const pagedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize, roleFilter]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({
      username: "",
      email: "",
      password: "",
      status: 1,
      role: "HOC_SINH"
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      username: user.username || "",
      email: user.email || "",
      password: "",
      status: user.status ?? 1,
      role: user.role || "HOC_SINH"
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Xóa tài khoản ${user.username}?`)) return;
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
    } catch (err) {
      setError("Không thể xóa tài khoản.");
    }
  };

  // Reset password action removed; show password column directly.

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.username.trim()) {
      setFormError("Vui lòng nhập tên đăng nhập.");
      return;
    }
    if (!editingUser && !form.password.trim()) {
      setFormError("Vui lòng nhập mật khẩu.");
      return;
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      status: Number(form.status),
      role: form.role
    };
    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    try {
      if (editingUser) {
        const response = await updateUser(editingUser.id, payload);
        const updated = response?.data?.data;
        setUsers((prev) =>
          prev.map((item) => (item.id === editingUser.id ? (updated || item) : item))
        );
        const pwMsg = form.password.trim() ? " (mật khẩu đã được cập nhật)" : "";
        notifySuccess(`Cập nhật tài khoản thành công${pwMsg}.`);
      } else {
        const response = await createUser(payload);
        const created = response?.data?.data;
        if (created) setUsers((prev) => [created, ...prev]);
        notifySuccess("Tạo tài khoản thành công.");
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể lưu tài khoản. Vui lòng thử lại.";
      setFormError(msg);
    }
  };

  return (
    <div className="page users-page">
      <PageHeader
        title="Danh mục tài khoản"
        actions={
          <div className="flex items-center gap-4">
            <div className="dash-search users-search" style={{ margin: 0, width: 280 }}>
              <span className="dot" />
              <input
                placeholder="Tìm tên đăng nhập hoặc email..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--stroke)",
                  fontSize: "13px",
                  background: "#fff",
                  outline: "none"
                }}
              >
                <option value="all">Tất cả nhóm</option>
                <option value="HOC_SINH">Học sinh</option>
                <option value="GIAO_VIEN">Giáo viên</option>
                <option value="PHU_HUYNH">Phụ huynh</option>
              </select>
            </div>
            <button className="btn-primary" onClick={openCreate}>
              Thêm tài khoản
            </button>
          </div>
        }
      />

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng tài khoản</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Hoạt động</div>
          <div className="stat-value">{loading ? "..." : stats.activeCount}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Tạm khóa</div>
          <div className="stat-value">{loading ? "..." : stats.lockedCount}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách tài khoản</div>
          </div>
          <div className="panel-pill">{filteredUsers.length} tài khoản</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && filteredUsers.length === 0 && (
          <div className="table-empty">Không tìm thấy tài khoản phù hợp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Tên đăng nhập</div>
            <div>Email</div>
            <div>Phân quyền</div>
            <div>Trạng thái</div>
            <div>Ngày tạo</div>
            <div>Thao tác</div>
          </div>
          {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : pagedUsers.map((user, index) => (
                <div className="table-row" key={user.id}>
                  <div className="table-id">{(page - 1) * pageSize + index + 1}</div>
                  <div className="table-main">
                    <div className="table-title">{user.username}</div>
                    <div className="table-meta">Mã: {user.id}</div>
                  </div>
                  <div className="table-email">{user.email || "--"}</div>
                  <div>
                    <span className={`role-pill ${getRoleClassName(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`status-pill ${
                        user.status === 1 ? "status-active" : "status-locked"
                      }`}
                    >
                      {getStatusLabel(user.status)}
                    </span>
                  </div>
                  <div className="table-date">
                    {formatDate(user.createdAt) || "--"}
                  </div>
                  <div className="table-actions">
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => openEdit(user)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn-outline btn-sm"
                      style={{ background: "#f59e0b", color: "#fff", borderColor: "#f59e0b" }}
                      onClick={async () => {
                        if (window.confirm(`Bạn muốn cấp lại mật khẩu mặc định cho tài khoản ${user.username}?`)) {
                          try {
                            await resetPassword(user.id);
                            notifySuccess("Đã đặt lại mật khẩu về mặc định thành công.");
                          } catch {
                            notifyError("Không thể đặt lại mật khẩu.");
                          }
                        }
                      }}
                    >
                      Cấp lại MK
                    </button>
                    <button
                      className="rounded-lg p-sm text-outline hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDelete(user)}
                      title="Xóa"
                    >
                      <MaterialIcon name="delete" className="text-[20px]" />
                    </button>
                  </div>
                </div>
              ))}
        </div>
        <div className="pagination">
          <button
            className="btn-outline btn-sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Trước
          </button>
          <div className="pagination-info">
            Trang {page} / {totalPages}
          </div>
          <button
            className="btn-outline btn-sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Sau
          </button>
        </div>
      </div>

      <SimpleModal
        open={modalOpen}
        title={editingUser ? "Cập nhật tài khoản" : "Thêm tài khoản"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Tên đăng nhập</span>
            <input
              value={form.username}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, username: event.target.value }))
              }
              placeholder="vd: quantri"
            />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="vd: admin@gmail.com"
            />
          </label>
          <label className="form-field">
            <span>
              Mật khẩu {editingUser ? "(để trống nếu không đổi)" : ""}
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="••••••"
            />
          </label>
          <label className="form-field">
            <span>Trạng thái</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: Number(event.target.value)
                }))
              }
            >
              <option value={1}>Hoạt động</option>
              <option value={0}>Tạm khóa</option>
            </select>
          </label>
          <label className="form-field">
            <span>Phân quyền</span>
            <select
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  role: event.target.value
                }))
              }
            >
              <option value="ADMIN">Quản trị</option>
              <option value="HOC_SINH">Học sinh</option>
              <option value="GIAO_VIEN">Giáo viên</option>
              <option value="VAN_THU">Văn thư</option>
              <option value="PHU_HUYNH">Phụ huynh</option>
            </select>
          </label>
          {formError && <div className="form-error">{formError}</div>}
          <div className="form-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {editingUser ? "Cập nhật" : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}