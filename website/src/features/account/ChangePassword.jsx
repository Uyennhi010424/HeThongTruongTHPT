import { useState, useMemo } from "react";
import { changePasswordMe } from "../../api/userApi.js";
import { useNavigate } from "react-router-dom";
import { PASSWORD_RULES, validatePassword, getPasswordStrength } from "../../utils/passwordPolicy.js";

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

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!oldPassword.trim()) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (oldPassword.trim() === newPassword.trim()) {
      setError("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp với mật khẩu mới.");
      return;
    }

    setSaving(true);
    try {
      await changePasswordMe(oldPassword.trim(), newPassword.trim());
      sessionStorage.removeItem("httt_must_change");
      sessionStorage.removeItem("httt_must_change_dismissed");
      try {
        const { notifySuccess } = await import("../../utils/notify.js");
        notifySuccess("Đổi mật khẩu thành công!");
      } catch (e) {
        alert("Đổi mật khẩu thành công!");
      }
      navigate("../profile");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Không thể đổi mật khẩu.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";
  const toggleBtnClass = "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg flex items-center justify-center";

  return (
    <div className="w-full h-full flex flex-col font-sans p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">
          Đổi mật khẩu
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Cập nhật mật khẩu mới với đầy đủ tiêu chuẩn bảo mật để bảo vệ tài khoản.
        </p>
      </div>

      {/* Card Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 p-6 sm:p-8 w-full">
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-200">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className={labelClass}>Mật khẩu hiện tại</label>
            <div className="relative w-full">
              <input
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className={inputClass}
                required
              />
              <button type="button" className={toggleBtnClass} onClick={() => setShowOld((s) => !s)}>
                <span className="material-symbols-outlined text-[18px]">{showOld ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass}>Mật khẩu mới</label>
              {newPassword && (
                <span className={`text-xs font-bold ${strength.textColor}`}>
                  Độ mạnh: {strength.label}
                </span>
              )}
            </div>
            <div className="relative w-full">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                className={inputClass}
                required
              />
              <button type="button" className={toggleBtnClass} onClick={() => setShowNew((s) => !s)}>
                <span className="material-symbols-outlined text-[18px]">{showNew ? "visibility_off" : "visibility"}</span>
              </button>
            </div>

            {/* Strength Meter Bar */}
            {newPassword && (
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            )}

            {/* Checklist of Password Rules */}
            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
              <div className="text-xs font-bold text-slate-600 mb-1">Quy chuẩn mật khẩu an toàn:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(newPassword);
                  return (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        passed ? "text-emerald-700 font-semibold" : "text-slate-500"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {passed ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
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
                required
              />
              <button type="button" className={toggleBtnClass} onClick={() => setShowConfirm((s) => !s)}>
                <span className="material-symbols-outlined text-[18px]">{showConfirm ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
            {confirmPassword && newPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-500 mt-1 font-medium">Mật khẩu xác nhận chưa khớp với mật khẩu mới.</p>
            )}
            {confirmPassword && newPassword && confirmPassword === newPassword && (
              <p className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check</span> Mật khẩu xác nhận đã trùng khớp.
              </p>
            )}
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center min-w-[150px] gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
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

