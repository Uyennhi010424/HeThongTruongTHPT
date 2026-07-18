import { useEffect, useState } from "react";
import { getGiaoVien, getCurrentGiaoVien, updateGiaoVien } from "../../api/giaovienApi.js";
import { getUsers, updateUser } from "../../api/userApi.js";
import { getChuNhiem } from "../../api/chunhiemApi.js";
import { getLop } from "../../api/lopApi.js";
import { notifyError, notifySuccess } from "../../utils/notify.js";
import { getCurrentUsernameFromToken, findTeacherByUsername, getTeacherSubjectLabel } from "../../utils/teacherProfile.js";
import { readCachedAvatar, writeCachedAvatar } from "../../utils/avatarCache.js";

export default function TeacherProfile() {
  const [teacher, setTeacher] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [homeroomClass, setHomeroomClass] = useState(null);
  const [editable, setEditable] = useState({ hoTen: "", boMon: "", soDienThoai: "", email: "", username: "" });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [gvRes, usersRes, currentGvRes, cnRes, lopRes] = await Promise.all([
          getGiaoVien(), getUsers(), getCurrentGiaoVien(), getChuNhiem(), getLop()
        ]);
        if (!active) return;
        const gvs = gvRes?.data?.data || [];
        const users = usersRes?.data?.data || [];
        const username = getCurrentUsernameFromToken();
        const found = currentGvRes?.data?.data || findTeacherByUsername(gvs, username) || gvs.find((g) => String(g.email || "").toLowerCase() === String(username || "").toLowerCase()) || null;
        if (!found) {
          setTeacher(null);
          return;
        }
        setTeacher(found);
        setAvatarPreview(
          readCachedAvatar({ username, role: "teacher" }) || ""
        );

        // Find homeroom class
        const assignments = cnRes?.data?.data || [];
        const classes = lopRes?.data?.data || [];
        const cnAssignment = assignments.find(
          (item) => Number(item?.giaoVienId) === Number(found.id)
        ) || null;
        if (cnAssignment?.lopId) {
          const foundClass = classes.find(
            (c) => String(c.id) === String(cnAssignment.lopId)
          ) || null;
          setHomeroomClass(foundClass);
        }
        const matchedUser = users.find((u) => String(u.username || "").trim().toLowerCase() === String(found.username || username || "").toLowerCase())
          || users.find((u) => String(u.email || "").trim().toLowerCase() === String(found.email || username || "").toLowerCase())
          || null;
        setUser(matchedUser);
        setEditable({
          hoTen: found.hoTen || "",
          boMon: found.boMon || "",
          soDienThoai: found.sdt || found.soDienThoai || "",
          email: found.email || (matchedUser && matchedUser.email) || "",
          username: (matchedUser && matchedUser.username) || found.username || ""
        });
      } catch (err) {
        if (!active) return;
        setError("Không thể tải thông tin giáo viên. Vui lòng thử lại.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => (active = false);
  }, []);

  const handleAvatarChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setAvatarPreview(r.result);
    r.readAsDataURL(f);
  };

  const handleSaveProfile = async () => {
    if (!teacher) return;
    setSaving(true);
    try {
      const gvPayload = {
        hoTen: editable.hoTen,
        boMon: editable.boMon,
        soDienThoai: editable.soDienThoai,
        email: editable.email
      };
      await updateGiaoVien(teacher.id, gvPayload);
      if (user?.id) {
        try {
          await updateUser(user.id, { username: editable.username, email: editable.email });
        } catch {
          // ignore user update failure
        }
      }
      setTeacher((t) => ({ ...t, sdt: editable.soDienThoai, ...gvPayload }));
      try {
        writeCachedAvatar({
          avatar: avatarPreview || "",
          username: editable.username || editable.email || getCurrentUsernameFromToken(),
          role: "teacher"
        });
      } catch (e) {
        // ignore
      }
      notifySuccess("Lưu hồ sơ thành công.");
    } catch (err) {
      console.error(err);
      notifyError("Lưu hồ sơ thất bại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="page users-page">
      <div className="card table-empty">Đang tải thông tin...</div>
    </div>
  );
  if (error) return (
    <div className="page users-page">
      <div className="card table-empty" style={{ color: "#b91c1c" }}>{error}</div>
    </div>
  );
  if (!teacher) return (
    <div className="page users-page">
      <div className="card table-empty">Không tìm thấy thông tin giáo viên cho tài khoản này.</div>
    </div>
  );

  return (
    <div className="page users-page">

      <div className="card profile-card">
        <div className="profile-header-row">
          <div className="profile-avatar-wrapper">
            <label className="profile-avatar-label">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-fallback" aria-hidden>
                  <span className="material-symbols-outlined text-[48px] text-[#9cb6de]">person</span>
                </div>
              )}
              <input type="file" accept="image/*" className="profile-avatar-input" onChange={handleAvatarChange} />
              <div className="profile-avatar-overlay">
                <span className="material-symbols-outlined">photo_camera</span>
              </div>
            </label>
          </div>
          <div className="profile-header-meta">
            <div className="panel-title">{teacher.hoTen || "Giáo viên"}</div>
            <div className="panel-subtitle">
              Giáo viên {getTeacherSubjectLabel(teacher)}
              {homeroomClass ? ` (Chủ nhiệm lớp ${homeroomClass.tenLop})` : ""}
            </div>
          </div>
          <div className="profile-header-actions">
            <button type="button" className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu hồ sơ"}
            </button>
          </div>
        </div>

        <div className="form-grid form-grid-teacher profile-form">
          <div className="form-section-title">Thông tin cá nhân</div>
          <label className="form-field">
            <span>Họ và tên</span>
            <input value={editable.hoTen} onChange={(e) => setEditable((p) => ({ ...p, hoTen: e.target.value }))} />
          </label>
          <label className="form-field">
            <span>Bộ môn</span>
            <input value={editable.boMon} onChange={(e) => setEditable((p) => ({ ...p, boMon: e.target.value }))} />
          </label>

          <div className="form-section-title">Thông tin liên hệ</div>
          <label className="form-field">
            <span>Số điện thoại</span>
            <input value={editable.soDienThoai} onChange={(e) => setEditable((p) => ({ ...p, soDienThoai: e.target.value }))} />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input value={editable.email} onChange={(e) => setEditable((p) => ({ ...p, email: e.target.value }))} />
          </label>

          <div className="form-section-title">Tài khoản</div>
          <label className="form-field">
            <span>Tài khoản (username)</span>
            <input value={editable.username} onChange={(e) => setEditable((p) => ({ ...p, username: e.target.value }))} />
          </label>
        </div>
      </div>

      <div className="card mt-6">
        <div className="panel-title">Quản lý tài khoản</div>
        <div className="panel-subtitle">Chỉnh sửa hồ sơ và bảo mật</div>
        <div className="mt-4 flex gap-3">
          <button type="button" className="btn-outline" onClick={() => (window.location.href = "/teacher/profile/edit")}>
            Chỉnh sửa hồ sơ
          </button>
          <button type="button" className="btn-outline" onClick={() => (window.location.href = "/teacher/profile/settings")}>
            Cài đặt
          </button>
          <button type="button" className="btn-outline" onClick={() => (window.location.href = "/teacher/profile/change-password")}>
            Đổi mật khẩu
          </button>
        </div>
      </div>
    </div>
  );
}
