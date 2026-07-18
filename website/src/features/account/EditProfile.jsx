import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/edu/PageHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { ROLES } from "../../utils/constants.js";
import { getCurrentUsernameFromToken } from "../../utils/teacherProfile.js";
import { notifyError, notifySuccess } from "../../utils/notify.js";

// APIs theo vai trò
import { getUsers, updateUser } from "../../api/userApi.js";
import { getCurrentGiaoVien, updateGiaoVien } from "../../api/giaovienApi.js";
import { getCurrentHocSinh, updateHocSinh } from "../../api/hocsinhApi.js";
import { getCurrentPhuHuynh, updatePhuHuynh } from "../../api/phuhuynhApi.js";

export default function EditProfile() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const currentUsername = getCurrentUsernameFromToken();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entityId, setEntityId] = useState(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [originalForm, setOriginalForm] = useState({});

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);

        if (role === ROLES.ADMIN) {
          const usersRes = await getUsers({ username: currentUsername });
          const matched = (usersRes?.data?.data || [])[0] || null;
          if (!active) return;
          setUser(matched);
          const data = {
            username: matched?.username || "",
            email: matched?.email || ""
          };
          setForm(data);
          setOriginalForm(data);
          setEntityId(matched?.id || null);
        }

        if (role === ROLES.GIAOVIEN) {
          const res = await getCurrentGiaoVien();
          if (!active) return;
          const gv = res?.data?.data || null;
          setEntityId(gv?.id || null);
          const data = {
            hoTen: gv?.hoTen || "",
            boMon: gv?.boMon || "",
            soDienThoai: gv?.sdt || gv?.soDienThoai || "",
            email: gv?.email || "",
            diaChi: gv?.diaChi || ""
          };
          setForm(data);
          setOriginalForm(data);

          // Tìm user để cập nhật username/email
          try {
            const usersRes = await getUsers();
            const users = usersRes?.data?.data || [];
            const matchedUser = users.find(
              (u) => String(u.username || "").toLowerCase() === String(gv?.username || currentUsername || "").toLowerCase()
            ) || null;
            setUser(matchedUser);
          } catch { /* ignore */ }
        }

        if (role === ROLES.HOCSINH) {
          const res = await getCurrentHocSinh();
          if (!active) return;
          const hs = res?.data?.data || null;
          setEntityId(hs?.id || null);
          const data = {
            hoTen: hs?.hoTen || "",
            sdt: hs?.sdt || "",
            diaChi: hs?.diaChi || "",
            email: hs?.email || ""
          };
          setForm(data);
          setOriginalForm(data);
        }

        if (role === ROLES.PHUHUYNH) {
          const res = await getCurrentPhuHuynh();
          if (!active) return;
          const ph = res?.data?.data || null;
          setEntityId(ph?.id || null);
          const data = {
            hoTen: ph?.hoTen || "",
            soDienThoai: ph?.soDienThoai || "",
            email: ph?.email || ""
          };
          setForm(data);
          setOriginalForm(data);
        }
      } catch {
        if (active) notifyError("Không thể tải thông tin hồ sơ.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => { active = false; };
  }, [role, currentUsername]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!entityId) {
      notifyError("Không tìm thấy hồ sơ để cập nhật.");
      return;
    }

    setSaving(true);
    try {
      if (role === ROLES.ADMIN) {
        await updateUser(entityId, {
          username: form.username?.trim(),
          email: form.email?.trim()
        });
      }

      if (role === ROLES.GIAOVIEN) {
        await updateGiaoVien(entityId, {
          hoTen: form.hoTen?.trim(),
          boMon: form.boMon?.trim(),
          soDienThoai: form.soDienThoai?.trim(),
          email: form.email?.trim(),
          diaChi: form.diaChi?.trim()
        });
        if (user?.id) {
          try {
            await updateUser(user.id, {
              email: form.email?.trim()
            });
          } catch { /* ignore */ }
        }
      }

      if (role === ROLES.HOCSINH) {
        await updateHocSinh(entityId, {
          hoTen: form.hoTen?.trim(),
          sdt: form.sdt?.trim(),
          diaChi: form.diaChi?.trim(),
          email: form.email?.trim()
        });
      }

      if (role === ROLES.PHUHUYNH) {
        await updatePhuHuynh(entityId, {
          hoTen: form.hoTen?.trim(),
          soDienThoai: form.soDienThoai?.trim(),
          email: form.email?.trim()
        });
      }

      setOriginalForm({ ...form });
      notifySuccess("Cập nhật hồ sơ thành công.");
    } catch (err) {
      notifyError(err?.response?.data?.message || "Cập nhật hồ sơ thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm);

  const getRoleLabel = () => {
    switch (role) {
      case ROLES.ADMIN: return "Quản trị viên";
      case ROLES.GIAOVIEN: return "Giáo viên";
      case ROLES.HOCSINH: return "Học sinh";
      case ROLES.PHUHUYNH: return "Phụ huynh";
      default: return "";
    }
  };

  const getBackPath = () => {
    switch (role) {
      case ROLES.ADMIN: return "/admin/profile";
      case ROLES.GIAOVIEN: return "/teacher/profile";
      case ROLES.HOCSINH: return "/student/profile";
      case ROLES.PHUHUYNH: return "/parent/home";
      default: return "/";
    }
  };

  if (loading) {
    return (
      <div className="page users-page">
        <PageHeader title="Chỉnh sửa hồ sơ" />
        <div className="card table-empty">Đang tải thông tin...</div>
      </div>
    );
  }

  return (
    <div className="page users-page">
      <PageHeader title="Chỉnh sửa hồ sơ" />

      <div className="card profile-card">
        <div className="profile-header-row">
          <div className="profile-header-meta">
            <div className="panel-title">Chỉnh sửa hồ sơ {getRoleLabel()}</div>
            <div className="panel-subtitle">Cập nhật thông tin cá nhân của bạn</div>
          </div>
          <div className="profile-header-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate(getBackPath())}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || !isDirty}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        <div className="form-grid form-grid-teacher profile-form">
          {/* Admin */}
          {role === ROLES.ADMIN && (
            <>
              <div className="form-section-title">Thông tin tài khoản</div>
              <label className="form-field">
                <span>Tài khoản</span>
                <input
                  value={form.username || ""}
                  onChange={(e) => handleChange("username", e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </label>
            </>
          )}

          {/* Giáo viên */}
          {role === ROLES.GIAOVIEN && (
            <>
              <div className="form-section-title">Thông tin cá nhân</div>
              <label className="form-field">
                <span>Họ và tên</span>
                <input
                  value={form.hoTen || ""}
                  onChange={(e) => handleChange("hoTen", e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Bộ môn</span>
                <input
                  value={form.boMon || ""}
                  onChange={(e) => handleChange("boMon", e.target.value)}
                />
              </label>

              <div className="form-section-title">Thông tin liên hệ</div>
              <label className="form-field">
                <span>Số điện thoại</span>
                <input
                  type="tel"
                  value={form.soDienThoai || ""}
                  onChange={(e) => handleChange("soDienThoai", e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Địa chỉ</span>
                <input
                  value={form.diaChi || ""}
                  onChange={(e) => handleChange("diaChi", e.target.value)}
                />
              </label>
            </>
          )}

          {/* Học sinh */}
          {role === ROLES.HOCSINH && (
            <>
              <div className="form-section-title">Thông tin cá nhân</div>
              <label className="form-field">
                <span>Họ và tên</span>
                <input
                  value={form.hoTen || ""}
                  onChange={(e) => handleChange("hoTen", e.target.value)}
                />
              </label>

              <div className="form-section-title">Thông tin liên hệ</div>
              <label className="form-field">
                <span>Số điện thoại</span>
                <input
                  type="tel"
                  value={form.sdt || ""}
                  onChange={(e) => handleChange("sdt", e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Địa chỉ</span>
                <input
                  value={form.diaChi || ""}
                  onChange={(e) => handleChange("diaChi", e.target.value)}
                />
              </label>
            </>
          )}

          {/* Phụ huynh */}
          {role === ROLES.PHUHUYNH && (
            <>
              <div className="form-section-title">Thông tin cá nhân</div>
              <label className="form-field">
                <span>Họ và tên</span>
                <input
                  value={form.hoTen || ""}
                  onChange={(e) => handleChange("hoTen", e.target.value)}
                />
              </label>

              <div className="form-section-title">Thông tin liên hệ</div>
              <label className="form-field">
                <span>Số điện thoại</span>
                <input
                  type="tel"
                  value={form.soDienThoai || ""}
                  onChange={(e) => handleChange("soDienThoai", e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </label>
            </>
          )}
        </div>
      </div>

      <div className="card mt-6">
        <div className="panel-title">Đổi mật khẩu</div>
        <div className="panel-subtitle">Quản lý mật khẩu tài khoản</div>
        <div className="mt-4">
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              const basePath = getBackPath().replace(/\/profile$/, "");
              navigate(`${basePath}/profile/change-password`);
            }}
          >
            Đổi mật khẩu
          </button>
        </div>
      </div>
    </div>
  );
}
