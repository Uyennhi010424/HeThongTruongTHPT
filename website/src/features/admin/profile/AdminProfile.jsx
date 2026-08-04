import { useEffect, useMemo, useRef, useState } from "react";
import { getUsers, updateUser, changePassword } from "../../../api/userApi.js";
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

// Modal for Changing Password
function ChangePasswordModal({ isOpen, onClose, userId }) {
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!pwForm.oldPassword.trim()) { setError("Vui lòng nhập mật khẩu cũ."); return; }
    if (!pwForm.newPassword.trim()) { setError("Vui lòng nhập mật khẩu mới."); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setError("Mật khẩu mới và xác nhận không khớp."); return; }
    if (pwForm.newPassword.length < 6) { setError("Mật khẩu mới phải ít nhất 6 ký tự."); return; }
    if (!userId) { setError("Không xác định được tài khoản."); return; }

    setSaving(true);
    try {
      await changePassword(userId, pwForm.oldPassword.trim(), pwForm.newPassword.trim());
      notifySuccess("Đổi mật khẩu thành công!");
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu cũ.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#FDFBF7] rounded-[20px] shadow-xl overflow-hidden border border-stone-200">
        <div className="flex items-center justify-between border-b border-stone-200 px-8 py-5 bg-white">
          <h3 className="text-lg font-semibold text-blue-900">Đổi mật khẩu</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 px-4 py-3 text-sm text-red-600 rounded-xl border border-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">Mật khẩu hiện tại</label>
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  className="h-12 w-full rounded-xl border border-stone-300 bg-white pl-4 pr-10 text-sm text-stone-800 outline-none transition focus:border-stone-800 focus:ring-1 focus:ring-stone-800"
                  value={pwForm.oldPassword}
                  onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 flex items-center justify-center h-8 w-8" onClick={() => setShowOld(v => !v)}>
                  {showOld ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  className="h-12 w-full rounded-xl border border-stone-300 bg-white pl-4 pr-10 text-sm text-stone-800 outline-none transition focus:border-stone-800 focus:ring-1 focus:ring-stone-800"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 flex items-center justify-center h-8 w-8" onClick={() => setShowNew(v => !v)}>
                  {showNew ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="h-12 w-full rounded-xl border border-stone-300 bg-white pl-4 pr-10 text-sm text-stone-800 outline-none transition focus:border-stone-800 focus:ring-1 focus:ring-stone-800"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 flex items-center justify-center h-8 w-8" onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4 border-t border-stone-200 pt-6">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="flex h-12 items-center gap-2 rounded-xl bg-stone-900 px-8 text-sm font-medium text-stone-50 shadow-sm transition hover:bg-stone-800 disabled:opacity-60">
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProfile() {
  const currentUsername = useMemo(() => getCurrentUsernameFromToken(), []);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [form, setForm] = useState({ username: "", hoTen: "", email: "", role: "", status: "1" });
  
  // Navigation State
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'security'
  
  // Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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
      <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[20px] bg-white shadow-xl border border-stone-200/80">
        
        {/* ── Header ── */}
        <div className="flex h-[90px] items-center border-b border-stone-200 bg-white px-10">
          <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Cài đặt tài khoản</h1>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col md:flex-row min-h-[650px]">
          
          {/* ── Left Sidebar ── */}
          <div className="w-full border-r border-stone-200 bg-[#FAFAFA] md:w-[260px] shrink-0 pt-8 pb-10 px-4">
            <nav className="flex flex-col space-y-1.5">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex w-full items-center rounded-xl px-5 py-3 text-[14px] transition-all ${
                  activeTab === "profile" 
                    ? "bg-stone-100 text-stone-900 font-semibold" 
                    : "bg-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                }`}
              >
                Hồ sơ của tôi
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex w-full items-center rounded-xl px-5 py-3 text-[14px] transition-all ${
                  activeTab === "security" 
                    ? "bg-stone-100 text-stone-900 font-semibold" 
                    : "bg-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                }`}
              >
                Bảo mật tài khoản
              </button>
            </nav>
          </div>

          {/* ── Right Content Area ── */}
          <div className="flex-1 bg-white p-12">
            
            {/* Tab: Profile */}
            {activeTab === "profile" && (
              <div className="max-w-[640px] animate-fade-in">
                <h2 className="mb-10 text-2xl font-extrabold text-blue-900 tracking-tight">Hồ sơ của tôi</h2>
                
                {/* Avatar Section */}
                <div className="mb-12 flex items-center gap-8 border-b border-stone-100 pb-10">
                  <div className="relative shrink-0">
                    <div className="h-20 w-20 overflow-hidden rounded-full bg-stone-100 border border-stone-200">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-stone-200">
                          <span className="text-2xl font-semibold text-stone-600">{initials}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-10 items-center rounded-xl px-5 bg-stone-800 text-[13px] font-medium text-stone-50 transition hover:bg-stone-700 shadow-sm"
                      >
                        Đổi ảnh
                      </button>
                      <button
                        type="button"
                        onClick={handleAvatarRemove}
                        className="flex h-10 items-center rounded-xl px-5 border border-stone-300 bg-white text-[13px] font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
                      >
                        Xóa
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                    <p className="text-[13px] text-stone-400">Định dạng PNG, JPEG, GIF (Tối đa 2MB)</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-7">
                  {/* Row 1: Username & Role */}
                  <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[14px] font-medium text-stone-700">Tên đăng nhập</label>
                      <input
                        className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50 pl-4 pr-4 text-[14px] text-stone-500 outline-none cursor-not-allowed"
                        value={form.username}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[14px] font-medium text-stone-700">Vai trò</label>
                      <input
                        className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50 pl-4 pr-4 text-[14px] text-stone-500 outline-none cursor-not-allowed"
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

                {/* Save Button */}
                <div className="mt-12 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="h-12 rounded-xl bg-stone-900 hover:bg-stone-800 px-8 text-[14px] font-medium text-stone-50 shadow-sm transition active:scale-95 disabled:opacity-60"
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Security */}
            {activeTab === "security" && (
              <div className="max-w-[640px] animate-fade-in">
                <h2 className="mb-10 text-2xl font-extrabold text-blue-900 tracking-tight">Bảo mật tài khoản</h2>

                <div className="flex flex-col">
                  
                  {/* Password Section */}
                  <div className="border-b border-stone-100 pb-10 mb-10">
                    <h3 className="text-[16px] font-medium text-blue-900 mb-6">Mật khẩu</h3>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                      <div className="flex-1">
                        <label className="mb-2 block text-[14px] font-medium text-stone-700">Mật khẩu hiện tại</label>
                        <input
                          type="password"
                          className="h-12 w-full max-w-[300px] rounded-xl border border-stone-200 bg-stone-50 pl-4 pr-4 text-[14px] text-stone-400 outline-none cursor-not-allowed tracking-widest"
                          value="********"
                          disabled
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="h-12 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 px-6 text-[14px] font-medium text-stone-700 transition shrink-0"
                      >
                        Đổi mật khẩu
                      </button>
                    </div>
                  </div>

                  {/* 2-Step Verification Section */}
                  <div className="border-b border-stone-100 pb-10 mb-10">
                    <div className="flex items-start justify-between gap-6">
                      <div className="pr-8">
                        <h3 className="text-[16px] font-medium text-blue-900 mb-2">Xác thực 2 bước (2FA)</h3>
                        <p className="text-[14px] text-stone-500 leading-relaxed">
                          Thêm một lớp bảo mật phụ vào tài khoản của bạn. Cần cung cấp mã xác nhận mỗi khi đăng nhập trên thiết bị mới.
                        </p>
                      </div>
                      <div className="shrink-0 mt-1">
                        {/* Fake toggle switch (disabled/off) */}
                        <div className="relative inline-flex h-7 w-12 items-center rounded-full bg-stone-200 transition-colors cursor-not-allowed">
                          <span className="inline-block h-5 w-5 translate-x-1 rounded-full bg-white shadow-sm transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Device Session Section */}
                  <div className="pb-4">
                    <div className="flex items-start justify-between gap-6">
                      <div className="pr-8">
                        <h3 className="text-[16px] font-medium text-blue-900 mb-2">Quản lý thiết bị</h3>
                        <p className="text-[14px] text-stone-500 leading-relaxed">
                          Đăng xuất khỏi tất cả các thiết bị khác, ngoại trừ thiết bị hiện tại bạn đang sử dụng.
                        </p>
                      </div>
                      <div className="shrink-0 mt-1">
                        <button className="h-10 rounded-xl bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-stone-300 px-5 text-[14px] font-medium text-stone-700 transition">
                          Đăng xuất tất cả
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
        userId={user.id} 
      />
    </div>
  );
}

