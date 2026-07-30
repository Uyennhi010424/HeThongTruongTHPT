import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentHocSinh, updateHocSinh } from "../../api/hocsinhApi.js";
import { uploadAvatar } from "../../api/uploadApi.js";
import { notifyError, notifySuccess } from "../../utils/notify.js";
import { readCachedAvatar, writeCachedAvatar } from "../../utils/avatarCache.js";
import ImageCropperModal from "../../components/common/ImageCropperModal.jsx";
import { getCurrentUsernameFromToken } from "../../utils/teacherProfile.js";
import { 
  User, Mail, Phone, MapPin, Calendar, GraduationCap,
  Shield, Users, Lock, LogOut, Camera, KeyRound, Activity,
  Briefcase
} from "lucide-react";

const formatDisplayDate = (value) => {
  if (!value) return "--";
  const str = typeof value === "string" ? value.slice(0, 10) : "";
  if (!str) return "--";
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
};

const FIELD_DEFS = [
  { key: "gioiTinh", label: "Giới tính", icon: User },
  { key: "ngaySinh", label: "Ngày sinh", icon: Calendar },
  { key: "email", label: "Email", icon: Mail },
  { key: "sdt", label: "Số điện thoại", icon: Phone },
  { key: "diaChi", label: "Địa chỉ", icon: MapPin },
  { key: "danToc", label: "Dân tộc", icon: User },
  { key: "tonGiao", label: "Tôn giáo", icon: User },
  { key: "namNhapHoc", label: "Năm nhập học", icon: Calendar },
  { key: "maBhyt", label: "Mã BHYT", icon: Activity },
  { key: "dienChinhSach", label: "Diện chính sách", icon: Shield }
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const currentUsername = useMemo(() => getCurrentUsernameFromToken(), []);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getCurrentHocSinh();
        if (!active) return;
        const current = res?.data?.data || null;
        setStudent(current);

        const avatar =
          current?.anhDaiDien ||
          readCachedAvatar({ username: currentUsername, role: "student" }) ||
          "";
        setAvatarPreview(avatar);
      } catch {
        if (!active) return;
        setError("Không thể tải hồ sơ học sinh.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProfile();
    return () => { active = false; };
  }, [currentUsername]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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

      const payload = { ...student, anhDaiDien: url };
      await updateHocSinh(student.id, payload);

      setStudent(payload);
      setAvatarPreview(url);
      
      writeCachedAvatar({
        avatar: url,
        username: currentUsername,
        role: "student"
      });
      notifySuccess("Cập nhật ảnh đại diện thành công.");
    } catch {
      notifyError("Không thể cập nhật ảnh đại diện.");
    }
  };

  const getFieldValue = (key) => {
    switch (key) {
      case "hoTen": return student?.hoTen || "--";
      case "maHocSinh": return student?.maHocSinh || student?.id || "--";
      case "username": return student?.user?.username || "--";
      case "email": return student?.email || "--";
      case "lop": return student?.lop?.tenLop || "Chưa có lớp";
      case "giaoVienChuNhiem": return student?.lop?.gvcn?.hoTen || "--";
      case "ngaySinh": return formatDisplayDate(student?.ngaySinh);
      case "gioiTinh": return (student?.gioiTinh === "NU" || student?.gioiTinh === "false" || student?.gioiTinh === false) ? "Nữ" : "Nam";
      case "sdt": return student?.sdt || "--";
      case "diaChi": return student?.diaChi || "--";
      case "danToc": return student?.danToc || "Không rõ";
      case "tonGiao": return student?.tonGiao || "Không rõ";
      case "namNhapHoc": return student?.namNhapHoc || "--";
      case "maBhyt": return student?.maBhyt || "--";
      case "dienChinhSach": return student?.dienChinhSach ? "Có" : "Không";
      case "trangThai":
        if (student?.trangThai === 2) return "Đã tốt nghiệp";
        if (student?.trangThai === 0) return "Tạm khóa";
        return "Đang học";
      default: return student?.[key] || "--";
    }
  };

  if (loading) return <div className="w-full h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium animate-pulse">Đang tải dữ liệu...</div>;
  if (error) return <div className="w-full h-screen bg-slate-50 flex items-center justify-center text-red-600 font-semibold">{error}</div>;

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* Profile Header Block */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-0 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6">
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload').click()}>
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-slate-100 shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                   <Camera className="w-8 h-8 text-white" />
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{student?.hoTen || "Chưa cập nhật"}</h1>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                    {getFieldValue('trangThai')}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-500 flex flex-wrap items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> {getFieldValue('maHocSinh')}</span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> Lớp {getFieldValue('lop')}</span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> GVCN: {getFieldValue('giaoVienChuNhiem')}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 md:p-12 max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Chi tiết thông tin
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {FIELD_DEFS.map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{field.label}</label>
                <div className="text-slate-800 font-medium text-[15px]">
                  {getFieldValue(field.key)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <ImageCropperModal 
        open={cropperOpen} 
        imageSrc={imageToCrop} 
        onClose={() => { setCropperOpen(false); setImageToCrop(null); }} 
        onCropComplete={handleCropComplete} 
      />
    </div>
  );
}
