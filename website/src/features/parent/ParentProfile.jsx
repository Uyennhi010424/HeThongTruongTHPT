import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header.jsx";
import { getCurrentPhuHuynh } from "../../api/phuhuynhApi.js";
import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";

export default function ParentProfile() {
  const navigate = useNavigate();
  const { students, currentStudent, selectedIndex, selectStudent, loading: studentsLoading } = useParentStudents();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getCurrentPhuHuynh();
        if (!active) return;
        setParent(res?.data?.data || null);
      } catch {
        if (!active) return;
        setError("Không thể tải thông tin phụ huynh.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const isLoading = loading || studentsLoading;

  return (
    <div className="page users-page student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Hồ sơ phụ huynh</h2>
          <p className="student-hero-subtitle">Xem thông tin cá nhân và danh sách con em.</p>
        </div>
      </section>

      <StudentSelector students={students} selectedIndex={selectedIndex} onSelect={selectStudent} />

      {error && <div className="card table-empty">{error}</div>}

      {!isLoading && parent && (
        <div className="card student-card">
          <div className="table-header">
            <div>
              <div className="panel-title">Thông tin phụ huynh</div>
              <div className="panel-subtitle">Thông tin cá nhân</div>
            </div>
            <div className="panel-pill">{parent.hoTen || "--"}</div>
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span>Họ và tên</span>
              <input value={parent.hoTen || "--"} disabled />
            </label>
            <label className="form-field">
              <span>Số điện thoại</span>
              <input value={parent.soDienThoai || "--"} disabled />
            </label>
            <label className="form-field">
              <span>Email</span>
              <input value={parent.email || "--"} disabled />
            </label>
            <label className="form-field">
              <span>Nghề nghiệp</span>
              <input value={parent.ngheNghiep || "--"} disabled />
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/parent/profile/edit")}
            >
              Chỉnh sửa hồ sơ
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/parent/profile/change-password")}
            >
              Đổi mật khẩu
            </button>
          </div>
        </div>
      )}

      {!isLoading && currentStudent && (
        <div className="card student-card">
          <div className="table-header">
            <div>
              <div className="panel-title">Thông tin học sinh</div>
              <div className="panel-subtitle">Con em đang theo dõi</div>
            </div>
            <div className="panel-pill">{currentStudent.lop?.tenLop || "--"}</div>
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span>Họ và tên</span>
              <input value={currentStudent.hoTen || "--"} disabled />
            </label>
            <label className="form-field">
              <span>Lớp</span>
              <input value={currentStudent.lop?.tenLop || "Chưa xếp lớp"} disabled />
            </label>
            <label className="form-field">
              <span>Năm nhập học</span>
              <input value={currentStudent.namNhapHoc || "--"} disabled />
            </label>
            <label className="form-field">
              <span>Trạng thái</span>
              <input value={currentStudent.trangThai === 2 ? "Đã tốt nghiệp" : currentStudent.trangThai === 0 ? "Tạm khóa" : "Đang học"} disabled />
            </label>
          </div>
        </div>
      )}

      {isLoading && <div className="card table-empty">Đang tải thông tin...</div>}
    </div>
  );
}
