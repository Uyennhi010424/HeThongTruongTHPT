import { useEffect, useMemo, useRef, useState } from "react";
import { getUsers, updateUser } from "../../../api/userApi.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { getCurrentUsernameFromToken } from "../../../utils/teacherProfile.js";
import { readCachedAvatar, writeCachedAvatar } from "../../../utils/avatarCache.js";
import { uploadAvatar } from "../../../api/uploadApi.js";

const ROLE_LABELS = {
  ADMIN: "Quản trị viên",
  GIAOVIEN: "Giáo viên",
  HOCSINH: "Học sinh",
  PHUHUYNH: "Phụ huynh",
};

export default function AdminProfile() {
  const currentUsername = useMemo(() => getCurrentUsernameFromToken(), []);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [form, setForm] = useState({ username: "", hoTen: "", email: "", role: "", status: "1" });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const usersRes = await getUsers({ username: currentUsername });
        const users = usersRes?.data?.data || [];
        const matched = users[0] || null;
        setUser(matched);
        setForm({
          username: matched?.username || "",
          hoTen: matched?.hoTen || "",
          email: matched?.email || "",
          role: matched?.role || "ADMIN",
          status: String(matched?.status ?? 1),
        });
        const cached = matched?.anhDaiDien || readCachedAvatar({ username: matched?.username || currentUsername, role: "admin" });
        setAvatarPreview(cached || "");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUsername]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    setAvatarPreview("");
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      let finalAvatarUrl = avatarPreview;
      if (avatarPreview && avatarPreview.startsWith("data:image/")) {
        try {
          const response = await fetch(avatarPreview);
          const blob = await response.blob();
          const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
          const uploadRes = await uploadAvatar(file);
          if (uploadRes?.data?.data?.url) {
            finalAvatarUrl = uploadRes.data.data.url;
            setAvatarPreview(finalAvatarUrl);
          }
        } catch (e) {
          console.error("Lỗi upload avatar", e);
        }
      }

      const payload = {
        username: form.username.trim(),
        hoTen: form.hoTen.trim(),
        email: form.email.trim(),
        role: form.role,
        status: Number(form.status),
        anhDaiDien: finalAvatarUrl,
      };
      const res = await updateUser(user.id, payload);
      const updated = res?.data?.data;
      setUser(updated || user);
      try {
        writeCachedAvatar({
          avatar: avatarPreview || "",
          username: form.username || user?.username || currentUsername,
          role: "admin",
        });
        if (form.email) {
          writeCachedAvatar({
            avatar: avatarPreview || "",
            username: form.email,
            role: "admin",
          });
        }
        window.dispatchEvent(new CustomEvent("httt_avatar_changed", {
          detail: { avatar: avatarPreview || "", username: form.username, role: "admin" },
        }));
      } catch { /* ignore */ }
      notifySuccess("Lưu hồ sơ thành công.");
    } catch {
      notifyError("Lưu hồ sơ thất bại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-800 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7] text-stone-500 font-medium">
        Không tìm thấy thông tin.
      </div>
    );
  }

  const initials = (form.hoTen || form.username || "A").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8 md:p-12 font-sans text-stone-800 selection:bg-stone-200">
      <div className="mx-auto max-w-[840px] overflow-hidden rounded-[20px] bg-white shadow-xl border border-stone-200/80">
        
        {/* ── Header ── */}
        <div className="flex h-[80px] items-center border-b border-stone-200 bg-white px-8 md:px-10">
          <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Hồ sơ quản trị viên</h1>
        </div>

        {/* ── Body ── */}
        <div className="p-8 md:p-10">
          <div className="max-w-[680px] mx-auto">
            {/* Avatar Section */}
            <div className="mb-10 flex items-center gap-6 sm:gap-8 border-b border-stone-100 pb-8">
              <div className="relative shrink-0">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-stone-100 border border-stone-200 shadow-sm">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-stone-200">
                      <span className="text-2xl font-semibold text-stone-600">{initials}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 items-center rounded-xl px-5 bg-stone-800 text-[13px] font-medium text-stone-50 transition hover:bg-stone-700 shadow-sm"
                  >
                    Đổi ảnh
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleAvatarRemove}
                      className="flex h-10 items-center rounded-xl px-5 border border-stone-300 bg-white text-[13px] font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
                    >
                      Xóa
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <p className="text-[12px] text-stone-400">Định dạng PNG, JPEG, GIF (Tối đa 2MB)</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Row 1: Username & Role */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[14px] font-medium text-stone-700">Tên đăng nhập</label>
                  <input
                    className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50 pl-4 pr-4 text-[14px] text-stone-500 outline-none cursor-not-allowed font-medium"
                    value={form.username}
                    disabled
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[14px] font-medium text-stone-700">Vai trò</label>
                  <input
                    className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50 pl-4 pr-4 text-[14px] text-stone-500 outline-none cursor-not-allowed font-medium"
                    value={ROLE_LABELS[form.role] || form.role}
                    disabled
                  />
                </div>
              </div>

              {/* Row 2: Full Name */}
              <div>
                <label className="mb-2 block text-[14px] font-medium text-stone-700">Họ và tên</label>
                <input
                  className="h-12 w-full rounded-xl border border-stone-300 bg-white pl-4 pr-4 text-[14px] text-stone-800 outline-none transition focus:border-stone-800 focus:ring-1 focus:ring-stone-800"
                  value={form.hoTen}
                  placeholder="Nhập họ và tên đầy đủ"
                  onChange={(e) => setForm((p) => ({ ...p, hoTen: e.target.value }))}
                />
              </div>

              {/* Row 3: Email */}
              <div>
                <label className="mb-2 block text-[14px] font-medium text-stone-700">Email</label>
                <input
                  type="email"
                  className="h-12 w-full rounded-xl border border-stone-300 bg-white pl-4 pr-4 text-[14px] text-stone-800 outline-none transition focus:border-stone-800 focus:ring-1 focus:ring-stone-800"
                  value={form.email}
                  placeholder="example@email.com"
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-10 flex justify-end border-t border-stone-100 pt-8">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="h-12 rounded-xl bg-stone-900 hover:bg-stone-800 px-8 text-[14px] font-medium text-stone-50 shadow-sm transition active:scale-95 disabled:opacity-60 text-center"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

