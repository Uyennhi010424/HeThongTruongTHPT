import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentHocSinh, updateHocSinh } from "../../api/hocsinhApi.js";
import { uploadAvatar } from "../../api/uploadApi.js";
import { notifyError, notifySuccess } from "../../utils/notify.js";
import { readCachedAvatar, writeCachedAvatar } from "../../utils/avatarCache.js";
import { getCurrentUsernameFromToken } from "../../utils/teacherProfile.js";

const formatDisplayDate = (value) => {
  if (!value) return "--";
  const str = typeof value === "string" ? value.slice(0, 10) : "";
  if (!str) return "--";
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
};

const FIELD_DEFS = [
  { key: "hoTen", label: "Họ tên" },
  { key: "username", label: "Tài khoản" },
  { key: "email", label: "Email" },
  { key: "lop", label: "Lớp" },
  { key: "ngaySinh", label: "Ngày sinh" },
  { key: "gioiTinh", label: "Giới tính" },
  { key: "sdt", label: "Điện thoại" },
  { key: "diaChi", label: "Địa chỉ" },
  { key: "namNhapHoc", label: "Năm nhập học" },
  { key: "maBhyt", label: "Mã BHYT" },
  { key: "dienChinhSach", label: "Diện chính sách" },
  { key: "trangThai", label: "Trạng thái" }
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const currentUsername = useMemo(() => getCurrentUsernameFromToken(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

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

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      notifyError("Kích thước ảnh tối đa 2MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      notifyError("Chỉ chấp nhận file ảnh.");
      return;
    }

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      const uploadRes = await uploadAvatar(file);
      const url = uploadRes?.data?.data?.url;
      if (!url) {
        notifyError("Tải ảnh lên thất bại. Vui lòng thử lại.");
        return;
      }

      const payload = { ...student, anhDaiDien: url };
      const saveRes = await updateHocSinh(student.id, payload);
      const saved = saveRes?.data?.data || payload;
      setStudent(saved);

      writeCachedAvatar({
        avatar: url,
        username: student?.user?.username || student?.email || currentUsername,
        role: "student"
      });
      notifySuccess("Cập nhật ảnh đại diện thành công.");
    } catch {
      notifyError("Không thể cập nhật ảnh đại diện.");
    }
  };

  const getFieldValue = (key) => {
    switch (key) {
      case "username": return student?.user?.username || "--";
      case "email": return student?.email || "--";
      case "lop": return student?.lop?.tenLop || "Chưa có lớp";
      case "ngaySinh": return formatDisplayDate(student?.ngaySinh);
      case "gioiTinh": return student?.gioiTinh === "NU" ? "Nữ" : "Nam";
      case "sdt": return student?.sdt || "--";
      case "diaChi": return student?.diaChi || "--";
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

  return (
    <div className="student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Hồ sơ học sinh</h2>
          <p className="student-hero-subtitle">Xem thông tin cá nhân và cập nhật ảnh đại diện.</p>
        </div>
      </section>

      <div className="card student-card">
        <div className="table-header">
          <div>
            <div className="panel-title">Hồ sơ học sinh</div>
            <div className="panel-subtitle">Thông tin cá nhân</div>
          </div>
          <div className="panel-pill">{student?.lop?.tenLop || "Chưa có lớp"}</div>
        </div>

        {error && <div className="table-empty">{error}</div>}
        {!error && loading && <div className="table-empty">Đang tải dữ liệu...</div>}

        {!loading && !error && (
          <div className="form-grid">
            <div className="form-field form-field-wide">
              <span>Ảnh đại diện</span>
              <div className="flex items-center gap-4">
                <div className="profile-avatar-wrapper">
                  <label className="profile-avatar-label">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar" className="profile-avatar-img" />
                    ) : (
                      <div className="profile-avatar-fallback" aria-hidden>
                        <span className="material-symbols-outlined text-[44px] text-[#9cb6de]">person</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="profile-avatar-input"
                      onChange={handleAvatarChange}
                    />
                    <div className="profile-avatar-overlay">
                      <span className="material-symbols-outlined">photo_camera</span>
                    </div>
                  </label>
                </div>
                <div className="table-meta">Bấm vào ảnh để thay đổi ảnh đại diện.</div>
              </div>
            </div>

            {FIELD_DEFS.map(({ key, label }) => (
              <label className="form-field" key={key}>
                <span>{label}</span>
                <input value={getFieldValue(key)} disabled />
              </label>
            ))}
            <div className="form-field form-field-wide">
              <span>Quản lý tài khoản</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => navigate("/student/profile/edit")}
                >
                  Chỉnh sửa hồ sơ
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => navigate("/student/profile/change-password")}
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
