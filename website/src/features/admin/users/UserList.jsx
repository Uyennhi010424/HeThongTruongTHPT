import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser
} from "../../../api/userApi.js";

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
    case "GIAOVIEN":
      return "Giáo viên";
    case "HOCSINH":
      return "Học sinh";
    case "VAN_THU":
      return "Văn thư";
    case "PHUHUYNH":
      return "Phụ huynh";
    case "ADMIN":
      return "Quản trị";
    default:
      return "--";
  }
};

const getRoleClassName = (role) => {
  switch (role) {
    case "HOCSINH":
      return "role-hocsinh";
    case "GIAOVIEN":
      return "role-giaovien";
    case "PHUHUYNH":
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
    role: "HOCSINH"
  });
  const [formError, setFormError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getUsers();
      const data = response?.data?.data || [];
      const sorted = [...data].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));
      setUsers(sorted);
    } catch (err) {
      setError("Không thể tải danh sách tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchUsersSafe = async () => {
      if (!active) return;
      await fetchUsers();
    };

    fetchUsersSafe();

    const handleUsersUpdated = () => {
      fetchUsersSafe();
    };

    const handleStorage = (event) => {
      if (event.key === "usersUpdatedAt") {
        fetchUsersSafe();
      }
    };

    const handleWindowFocus = () => {
      fetchUsersSafe();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUsersSafe();
      }
    };

    const refreshTimer = window.setInterval(() => {
      fetchUsersSafe();
    }, 5000);

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
      role: "HOCSINH"
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
      role: user.role || "HOCSINH"
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
          prev.map((item) => (item.id === editingUser.id ? updated : item))
        );
      } else {
        const response = await createUser(payload);
        const created = response?.data?.data;
        setUsers((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError("Không thể lưu tài khoản. Vui lòng thử lại.");
    }
  };

  return (
    <div className="page users-page">
      <Header title="Danh mục tài khoản" />

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Quản lý tài khoản hệ thống</div>
          <div className="users-subtitle">
            Tìm kiếm, theo dõi trạng thái và cập nhật tài khoản
          </div>
        </div>
        <div className="users-actions">
          <div className="dash-search users-search">
            <span className="dot" />
            <input
              placeholder="Tìm theo tên đăng nhập hoặc email"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <label className="form-field users-filter-field">
            <span>Nhóm tài khoản</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="HOCSINH">Học sinh</option>
              <option value="GIAOVIEN">Giáo viên</option>
              <option value="PHUHUYNH">Phụ huynh</option>
            </select>
          </label>
          <button className="btn-primary" onClick={openCreate}>
            Thêm tài khoản
          </button>
        </div>
      </div>

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
            <div className="panel-subtitle">Dữ liệu lấy từ cơ sở dữ liệu</div>
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
                      className="btn-danger btn-sm"
                      onClick={() => handleDelete(user)}
                    >
                      Xóa
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
              <option value="HOCSINH">Học sinh</option>
              <option value="GIAOVIEN">Giáo viên</option>
              <option value="VAN_THU">Văn thư</option>
              <option value="PHUHUYNH">Phụ huynh</option>
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