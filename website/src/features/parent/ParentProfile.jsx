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
    <div className="flex-1 bg-white min-h-screen">
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4 border-b border-slate-200 shrink-0">
        <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-3">
          Hồ sơ phụ huynh
        </h2>
        <p className="text-slate-500 text-[14px] mt-2">
          Xem thông tin cá nhân và danh sách con em.
        </p>
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pt-2">
        <div className="mb-6">
          <StudentSelector students={students} selectedIndex={selectedIndex} onSelect={selectStudent} />
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center border border-red-100">{error}</div>}

        {!isLoading && parent && (
          <>
            <div className="border-b border-gray-200 pb-4 mb-6 mt-4 flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Thông tin phụ huynh</h2>
                <p className="text-sm text-slate-500 mt-1">Thông tin cá nhân</p>
              </div>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-100">
                {parent.hoTen || "--"}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={parent.hoTen || "--"} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={parent.soDienThoai || "--"} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={parent.email || "--"} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={parent.ngheNghiep || "--"} disabled />
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  type="button"
                  className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                  onClick={() => navigate("/parent/profile/edit")}
                >
                  Chỉnh sửa hồ sơ
                </button>
                <button
                  type="button"
                  className="px-6 py-2 bg-white text-slate-600 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                  onClick={() => navigate("/parent/profile/change-password")}
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </>
        )}

        {!isLoading && currentStudent && (
          <>
            <div className="border-b border-gray-200 pb-4 mb-6 mt-4 flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Thông tin học sinh</h2>
                <p className="text-sm text-slate-500 mt-1">Con em đang theo dõi</p>
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold border border-emerald-100">
                {currentStudent.lop?.tenLop || "--"}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã học sinh</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium" value={currentStudent.maHocSinh || "--"} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium" value={currentStudent.hoTen || "--"} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={currentStudent.lop?.tenLop || "Chưa xếp lớp"} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={currentStudent.ngaySinh ? currentStudent.ngaySinh.split('-').reverse().join('/') : "--"} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={(currentStudent.gioiTinh === "NU" || currentStudent.gioiTinh === "false" || currentStudent.gioiTinh === false || currentStudent.gioiTinh === "Nữ") ? "Nữ" : (currentStudent.gioiTinh ? "Nam" : "--")} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dân tộc / Tôn giáo</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={`${currentStudent.danToc || "--"} / ${currentStudent.tonGiao || "--"}`} disabled />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={currentStudent.diaChi || "--"} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Năm nhập học</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={currentStudent.namNhapHoc || "--"} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={currentStudent.trangThai === 2 ? "Đã tốt nghiệp" : currentStudent.trangThai === 0 ? "Tạm khóa" : "Đang học"} disabled />
                </div>
              </div>
            </div>
          </>
        )}

        {isLoading && (
          <div className="p-12 text-center text-slate-400">Đang tải thông tin...</div>
        )}
      </div>
    </div>
  );
}
