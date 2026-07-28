import { useState } from "react";
import { changePasswordMe } from "../../api/userApi.js";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!oldPassword.trim()) {
      setError("Vui lòng nhập mật khẩu cũ để xác nhận.");
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

    setSaving(true);
    try {
      await changePasswordMe(oldPassword.trim(), newPassword.trim());
      sessionStorage.removeItem("httt_must_change");
      sessionStorage.removeItem("httt_must_change_dismissed");
      try {
        const { notifySuccess } = await import("../../utils/notify.js");
        notifySuccess("Đổi mật khẩu thành công.");
      } catch (e) {
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

  const inputClass = "w-full h-12 rounded-[10px] border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 placeholder:text-slate-400";
  const labelClass = "block text-[14px] font-medium text-slate-700 mb-2";
  const toggleBtnClass = "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-md flex items-center justify-center";

  return (
    <div className="w-full h-full flex flex-col font-sans p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Đổi mật khẩu
        </h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500">
          Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
        </p>
      </div>

      {/* Card Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 sm:p-8 w-full flex-1">
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50/80 text-red-600 px-4 py-3.5 rounded-xl text-sm font-medium border border-red-100">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Mật khẩu hiện tại</label>
            <div className="relative w-full">
              <input
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu cũ"
                className={inputClass}
              />
              <button type="button" className={toggleBtnClass} onClick={() => setShowOld((s) => !s)}>
                <span className="material-symbols-outlined text-[18px]">{showOld ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Mật khẩu mới</label>
            <div className="relative w-full">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className={inputClass}
              />
              <button type="button" className={toggleBtnClass} onClick={() => setShowNew((s) => !s)}>
                <span className="material-symbols-outlined text-[18px]">{showNew ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Xác nhận mật khẩu mới</label>
            <div className="relative w-full">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className={inputClass}
              />
              <button type="button" className={toggleBtnClass} onClick={() => setShowConfirm((s) => !s)}>
                <span className="material-symbols-outlined text-[18px]">{showConfirm ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center min-w-[150px] gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-[11px] rounded-[10px] text-sm font-medium transition-all shadow-sm shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Đang xử lý...
                </>
              ) : (
                "Đổi mật khẩu"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
