import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getUsers, updateUser } from "../../../api/userApi.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { getCurrentUsernameFromToken } from "../../../utils/teacherProfile.js";
import { readCachedAvatar, writeCachedAvatar } from "../../../utils/avatarCache.js";

export default function AdminProfile() {
  const navigate = useNavigate();
  const currentUsername = useMemo(() => getCurrentUsernameFromToken(), []);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [form, setForm] = useState({ username: "", role: "", status: "1" });

  useEffect(() => {
    const load = async () => {
      try {
        const usersRes = await getUsers({ username: currentUsername });
        const users = usersRes?.data?.data || [];
        const matched = users[0] || null;

        setUser(matched);
        setForm({
          username: matched?.username || "",
          role: matched?.role || "ADMIN",
          status: String(matched?.status ?? 1)
        });
        const cached = readCachedAvatar({ username: matched?.username || currentUsername, role: "admin" });
        setAvatarPreview(cached || "");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUsername]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        username: form.username.trim(),
        role: form.role,
        status: Number(form.status)
      };
      const res = await updateUser(user.id, payload);
      const updated = res?.data?.data;
      setUser(updated || user);
      try {
        writeCachedAvatar({
          avatar: avatarPreview || "",
          username: form.username || user?.username || currentUsername,
          role: "admin"
        });
      } catch (e) {
        // ignore
      }
      notifySuccess("Lưu hồ sơ thành công.");
    } catch (err) {
      notifyError("Lưu hồ sơ thất bại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!user) return <div className="p-6">Không tìm thấy thông tin quản trị viên.</div>;

  return (
    <div className="page users-page">
      <PageHeader title="Thông tin cá nhân" />
      <div className="card">
        <div className="flex items-center gap-6">
          <div className="profile-avatar-wrapper">
            <label className="profile-avatar-label">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-fallback" aria-hidden>
                  <span className="material-symbols-outlined text-[44px] text-[#9cb6de]">person</span>
                </div>
              )}
              <input type="file" accept="image/*" className="profile-avatar-input" onChange={handleAvatarChange} />
              <div className="profile-avatar-overlay">
                <span className="material-symbols-outlined">photo_camera</span>
              </div>
            </label>
          </div>
          <div className="flex-1">
            <div className="panel-title">{form.username || "Quản trị viên"}</div>
            <div className="panel-subtitle">Admin</div>
          </div>
        </div>

        <div className="mt-6 form-grid form-grid-teacher">
          <label className="form-field">
            <span>Tài khoản</span>
            <input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
          </label>
          <label className="form-field">
            <span>Vai trò</span>
            <input value={form.role} disabled />
          </label>
          <label className="form-field">
            <span>Trạng thái</span>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="1">Hoạt động</option>
              <option value="0">Tạm khóa</option>
            </select>
          </label>
          <div className="form-field">
            <span>Đổi mật khẩu</span>
            <div>
              <button type="button" className="btn-outline" onClick={() => navigate("/admin/profile/change-password")}>Đổi mật khẩu</button>
            </div>
          </div>
        </div>

        <div className="form-actions mt-6">
          <button type="button" className="btn-outline" onClick={() => navigate("/admin/profile/edit")}>
            Chỉnh sửa hồ sơ
          </button>
          <button type="button" className="btn-outline" onClick={() => navigate("/admin/profile/settings")}>
            Cài đặt
          </button>
          <button type="button" className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu hồ sơ"}
          </button>
        </div>
      </div>
    </div>
  );
}
