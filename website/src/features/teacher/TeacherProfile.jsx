import { useEffect, useState } from "react";
import { getCurrentGiaoVien, updateGiaoVien } from "../../api/giaovienApi.js";
import { getMonHoc } from "../../api/monhocApi.js";
import { uploadAvatar } from "../../api/uploadApi.js";
import ImageCropperModal from "../../components/common/ImageCropperModal.jsx";
import { notifyError, notifySuccess } from "../../utils/notify.js";
import { getCurrentUsernameFromToken, findTeacherByUsername, getTeacherSubjectLabel } from "../../utils/teacherProfile.js";
import { readCachedAvatar, writeCachedAvatar } from "../../utils/avatarCache.js";

export default function TeacherProfile() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [homeroomClass, setHomeroomClass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [editable, setEditable] = useState({ hoTen: "", boMon: "", soDienThoai: "", email: "", username: "" });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [currentGvRes, monHocRes] = await Promise.all([
          getCurrentGiaoVien(), getMonHoc().catch(() => ({ data: { data: [] } }))
        ]);
        if (!active) return;
        
        const found = currentGvRes?.data?.data || null;
        const username = getCurrentUsernameFromToken();
        if (!found) {
          setTeacher(null);
          return;
        }
        setTeacher(found);
        setAvatarPreview(
          found.anhDaiDien || readCachedAvatar({ username, role: "teacher" }) || ""
        );

        if (found.isGvcn && found.tenLopChuNhiem) {
          setHomeroomClass({ tenLop: found.tenLopChuNhiem });
        } else {
          setHomeroomClass(null);
        }

        setEditable({
          hoTen: found.hoTen || "",
          boMon: found.boMon || "",
          soDienThoai: found.sdt || found.soDienThoai || "",
          email: found.email || "",
          username: found.username || username || ""
        });
        
        const mhData = monHocRes?.data?.data || [];
        setSubjects(mhData);
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

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  const handleAvatarChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      setImageToCrop(r.result);
      setCropperOpen(true);
    };
    r.readAsDataURL(f);
    e.target.value = null;
  };

  const handleCropComplete = async (croppedImage) => {
    setCropperOpen(false);
    setImageToCrop(null);

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(croppedImage);

    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      const uploadRes = await uploadAvatar(file);
      const url = uploadRes?.data?.data?.url;
      if (!url) {
        notifyError("Tải ảnh lên thất bại. Vui lòng thử lại.");
        return;
      }

      const gvPayload = {
        ...teacher,
        hoTen: editable.hoTen,
        boMon: editable.boMon,
        soDienThoai: editable.soDienThoai,
        email: editable.email,
        anhDaiDien: url
      };
      await updateGiaoVien(teacher.id, gvPayload);

      setTeacher((t) => ({ ...t, sdt: editable.soDienThoai, ...gvPayload }));
      setAvatarPreview(url);
      
      writeCachedAvatar({
        avatar: url,
        username: teacher?.username || teacher?.email || getCurrentUsernameFromToken(),
        role: "teacher"
      });
      notifySuccess("Cập nhật ảnh đại diện thành công.");
    } catch {
      notifyError("Không thể cập nhật ảnh đại diện.");
    }
  };

  const handleSaveProfile = async () => {
    if (!teacher) return;
    
    // Validation
    const { hoTen, boMon, soDienThoai, email } = editable;
    if (!hoTen.trim() || !boMon.trim() || !soDienThoai.trim() || !email.trim()) {
      notifyError("Vui lòng điền đầy đủ các thông tin cá nhân và liên hệ.");
      return;
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(soDienThoai.trim())) {
      notifyError("Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và gồm 10 chữ số).");
      return;
    }

    setSaving(true);
    try {
      const gvPayload = {
        ...teacher,
        hoTen: editable.hoTen,
        boMon: editable.boMon,
        soDienThoai: editable.soDienThoai,
        email: editable.email
      };
      await updateGiaoVien(teacher.id, gvPayload);
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
    <div className="w-full h-full flex items-center justify-center p-8 bg-[#F8FAFC]">
      <div className="text-slate-500 font-medium">Đang tải thông tin...</div>
    </div>
  );
  if (error) return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-[#F8FAFC]">
      <div className="text-red-600 font-medium">{error}</div>
    </div>
  );
  if (!teacher) return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-[#F8FAFC]">
      <div className="text-slate-500 font-medium">Không tìm thấy thông tin giáo viên cho tài khoản này.</div>
    </div>
  );

  const inputClass = "w-full h-12 rounded-[10px] border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 placeholder:text-slate-400";
  const labelClass = "block text-[14px] font-medium text-slate-700 mb-2";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans text-slate-900 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-[1600px] mx-auto flex flex-col gap-8">
        
        {/* Page Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hồ sơ giáo viên</h1>
          <p className="mt-1.5 text-[15px] font-medium text-slate-500">Quản lý và cập nhật thông tin cá nhân.</p>
        </div>

        {/* Header Profile Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              <label className="block h-[84px] w-[84px] rounded-2xl overflow-hidden border border-slate-200 cursor-pointer relative bg-slate-50 shadow-sm">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-[42px]">person</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
                </div>
              </label>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 m-0 tracking-tight">{teacher.hoTen || "Giáo viên"}</h2>
              <p className="text-[15px] text-slate-600 mt-1 font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">work</span>
                Giáo viên {getTeacherSubjectLabel(teacher)}
                {homeroomClass && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-md text-[13px]">
                      Chủ nhiệm lớp {homeroomClass.tenLop}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          
          <div className="shrink-0 flex items-center">
            <button 
              type="button" 
              onClick={handleSaveProfile} 
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-[10px] text-[14px] font-medium transition-all shadow-sm shadow-blue-500/20 disabled:opacity-60 min-w-[140px]"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Đang lưu...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Lưu hồ sơ
                </>
              )}
            </button>
          </div>
        </div>

        {/* Forms Container */}
        <div className="space-y-12">
          
          {/* Thông tin cá nhân */}
          <div>
            <h3 className="text-[16px] font-bold text-slate-900 mb-5 flex items-center gap-2 tracking-tight uppercase">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">person_outline</span>
              Thông tin cá nhân
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div>
                <label className={labelClass}>Họ và tên</label>
                <input 
                  value={editable.hoTen} 
                  onChange={(e) => setEditable((p) => ({ ...p, hoTen: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Bộ môn</label>
                <div className="relative">
                  <select
                    value={editable.boMon}
                    onChange={(e) => setEditable((p) => ({ ...p, boMon: e.target.value }))}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="" disabled>-- Chọn bộ môn --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.tenMon}>
                        {s.tenMon}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200"></div>

          {/* Thông tin liên hệ */}
          <div>
            <h3 className="text-[16px] font-bold text-slate-900 mb-5 flex items-center gap-2 tracking-tight uppercase">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">contact_mail</span>
              Thông tin liên hệ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div>
                <label className={labelClass}>Số điện thoại</label>
                <input 
                  value={editable.soDienThoai} 
                  onChange={(e) => setEditable((p) => ({ ...p, soDienThoai: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input 
                  value={editable.email} 
                  onChange={(e) => setEditable((p) => ({ ...p, email: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200"></div>

          {/* Tài khoản */}
          <div>
            <h3 className="text-[16px] font-bold text-slate-900 mb-5 flex items-center gap-2 tracking-tight uppercase">
              <span className="material-symbols-outlined text-amber-600 text-[20px]">manage_accounts</span>
              Thông tin tài khoản
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div>
                <label className={labelClass}>Tài khoản (Username)</label>
                <input 
                  value={editable.username} 
                  onChange={(e) => setEditable((p) => ({ ...p, username: e.target.value }))}
                  disabled
                  className="w-full h-12 rounded-[10px] border border-slate-200 bg-slate-100 px-4 text-sm outline-none text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      <ImageCropperModal
        open={cropperOpen}
        onClose={() => { setCropperOpen(false); setImageToCrop(null); }}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
