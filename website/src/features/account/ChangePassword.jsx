import Header from "../../components/common/Header.jsx";
import { useEffect, useState } from "react";
import { changePassword, getUsers } from "../../api/userApi.js";
import { getCurrentUsernameFromToken } from "../../utils/teacherProfile.js";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const username = getCurrentUsernameFromToken();
        const res = await getUsers();
        const users = res?.data?.data || [];
        const matched = users.find((u) => String(u.username || u.email || "").trim().toLowerCase() === String(username || "").toLowerCase());
        if (matched) setUserId(matched.id);
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!userId) {
      setError("Không xác định được tài khoản.");
      return;
    }
    if (!newPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và nhập lại không khớp.");
      return;
    }
    if (!oldPassword.trim()) {
      setError("Vui lòng nhập mật khẩu cũ để xác nhận.");
      return;
    }

    setSaving(true);
    try {
      await changePassword(userId, oldPassword.trim(), newPassword.trim());
      // Xóa flag mustChangePassword sau khi đổi thành công
      sessionStorage.removeItem("httt_must_change");
      sessionStorage.removeItem("httt_must_change_dismissed");
      try {
        const { notifySuccess } = await import("../../utils/notify.js");
        notifySuccess("Đổi mật khẩu thành công.");
      } catch (e) {
        // eslint-disable-next-line no-alert
        alert("Đổi mật khẩu thành công.");
      }
      navigate("../profile");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Không thể đổi mật khẩu.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page users-page">
      <Header title="Đổi mật khẩu" />
      <div className="card">
        <div className="panel-title">Đổi mật khẩu</div>
        <div className="panel-subtitle">Thay đổi mật khẩu tài khoản của bạn.</div>

        <form className="form-grid" onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          {error && <div className="table-empty">{error}</div>}
          <label className="form-field">
            <span>Mật khẩu cũ</span>
            <div className="password-input-wrap">
              <input
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu cũ"
              />
              <button type="button" className="password-toggle-btn" onClick={() => setShowOld((s) => !s)}>
                <span className="material-symbols-outlined">{showOld ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </label>

          <label className="form-field">
            <span>Mật khẩu mới</span>
            <div className="password-input-wrap">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
              />
              <button type="button" className="password-toggle-btn" onClick={() => setShowNew((s) => !s)}>
                <span className="material-symbols-outlined">{showNew ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </label>

          <label className="form-field">
            <span>Nhập lại mật khẩu mới</span>
            <div className="password-input-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />
              <button type="button" className="password-toggle-btn" onClick={() => setShowConfirm((s) => !s)}>
                <span className="material-symbols-outlined">{showConfirm ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </label>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving || loading}>
              {saving ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
