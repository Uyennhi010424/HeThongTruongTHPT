import { useEffect, useMemo, useState } from "react";
import Header from "../../components/common/Header.jsx";
import { getHocSinh, updateHocSinh } from "../../api/hocsinhApi.js";
import { getToken } from "../../store/authStore.js";

const formatDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string" && value.length >= 10) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getCurrentUsername = () => {
  const token = getToken();
  if (!token) return "";

  try {
    const payloadPart = token.split(".")[1] || "";
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(normalized));
    return String(payload?.sub || "").trim().toLowerCase();
  } catch {
    return "";
  }
};

export default function ProfilePage() {
  const currentUsername = useMemo(() => getCurrentUsername(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState({
    hoTen: "",
    ngaySinh: "",
    gioiTinh: "true",
    diaChi: "",
    sdt: "",
    email: "",
    namNhapHoc: "",
    maBhyt: "",
    dienChinhSach: "false",
    trangThai: "1"
  });

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getHocSinh();
        if (!active) return;
        const list = response?.data?.data || [];
        const matched = list.find(
          (item) => String(item?.email || "").trim().toLowerCase() === currentUsername
        );
        const current = matched || list[0] || null;
        setStudent(current);
        setForm({
          hoTen: current?.hoTen || "",
          ngaySinh: formatDateInput(current?.ngaySinh),
          gioiTinh: String(current?.gioiTinh ?? true),
          diaChi: current?.diaChi || "",
          sdt: current?.sdt || "",
          email: current?.email || "",
          namNhapHoc: current?.namNhapHoc ?? "",
          maBhyt: current?.maBhyt || "",
          dienChinhSach: String(current?.dienChinhSach ?? false),
          trangThai: String(current?.trangThai ?? 1)
        });
      } catch (err) {
        if (!active) return;
        setError("Không thể tải hồ sơ học sinh.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      active = false;
    };
  }, [currentUsername]);

  const info = useMemo(() => {
    return {
      lop: student?.lopHoc?.tenLop || "--",
      createdAt: student?.createdAt ? formatDateInput(student.createdAt) : "--"
    };
  }, [student]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!student?.id) return;
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...student,
        hoTen: form.hoTen.trim(),
        ngaySinh: form.ngaySinh || null,
        gioiTinh: form.gioiTinh === "true",
        diaChi: form.diaChi.trim(),
        sdt: form.sdt.trim(),
        email: form.email.trim(),
        namNhapHoc: form.namNhapHoc ? Number(form.namNhapHoc) : null,
        maBhyt: form.maBhyt.trim(),
        dienChinhSach: form.dienChinhSach === "true",
        trangThai: Number(form.trangThai)
      };
      const response = await updateHocSinh(student.id, payload);
      setStudent(response?.data?.data || payload);
    } catch (err) {
      setError("Không thể cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page users-page">
      <Header title="Thông tin cá nhân" />

      <div className="card">
        <div className="panel-title">Hồ sơ học sinh</div>
        <div className="panel-subtitle">Cập nhật thông tin cá nhân</div>

        {error && <div className="table-empty">{error}</div>}
        {!error && loading && <div className="table-empty">Đang tải dữ liệu...</div>}

        {!loading && !error && (
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Họ tên</span>
              <input
                value={form.hoTen}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, hoTen: event.target.value }))
                }
                placeholder="Nhập họ tên"
              />
            </label>
            <label className="form-field">
              <span>Ngày sinh</span>
              <input
                type="date"
                value={form.ngaySinh}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, ngaySinh: event.target.value }))
                }
              />
            </label>
            <label className="form-field">
              <span>Giới tính</span>
              <select
                value={form.gioiTinh}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, gioiTinh: event.target.value }))
                }
              >
                <option value="true">Nam</option>
                <option value="false">Nữ</option>
              </select>
            </label>
            <label className="form-field">
              <span>Điện thoại</span>
              <input
                value={form.sdt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, sdt: event.target.value }))
                }
                placeholder="Số điện thoại"
              />
            </label>
            <label className="form-field">
              <span>Email</span>
              <input
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="Email"
              />
            </label>
            <label className="form-field">
              <span>Địa chỉ</span>
              <input
                value={form.diaChi}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, diaChi: event.target.value }))
                }
                placeholder="Địa chỉ"
              />
            </label>
            <label className="form-field">
              <span>Năm nhập học</span>
              <input
                type="number"
                value={form.namNhapHoc}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, namNhapHoc: event.target.value }))
                }
                placeholder="2024"
              />
            </label>
            <label className="form-field">
              <span>Mã BHYT</span>
              <input
                value={form.maBhyt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, maBhyt: event.target.value }))
                }
                placeholder="BHYT"
              />
            </label>
            <label className="form-field">
              <span>Diện chính sách</span>
              <select
                value={form.dienChinhSach}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, dienChinhSach: event.target.value }))
                }
              >
                <option value="false">Không</option>
                <option value="true">Có</option>
              </select>
            </label>
            <label className="form-field">
              <span>Trạng thái</span>
              <select
                value={form.trangThai}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, trangThai: event.target.value }))
                }
              >
                <option value="1">Đang học</option>
                <option value="0">Tạm khóa</option>
              </select>
            </label>

            <div className="profile-summary">
              <div>
                <div className="table-title">Lớp</div>
                <div className="table-meta">{info.lop}</div>
              </div>
              <div>
                <div className="table-title">Ngày tạo</div>
                <div className="table-meta">{info.createdAt}</div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}