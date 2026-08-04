import { X, School } from "lucide-react";
import { useState } from "react";

export default function HocSinhTransferSchoolModal({ hooks }) {
  const {
    transferSchoolModalOpen,
    setTransferSchoolModalOpen,
    transferringStudent,
    submitTransferSchool
  } = hooks;

  const [truongMoi, setTruongMoi] = useState("");

  if (!transferSchoolModalOpen || !transferringStudent) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    submitTransferSchool(truongMoi);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <School className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Chuyển trường</h2>
              <p className="text-sm font-medium text-slate-500">
                {transferringStudent.hoTen}
              </p>
            </div>
          </div>
          <button
            onClick={() => setTransferSchoolModalOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium border border-amber-100">
              Lưu ý: Thao tác này sẽ đánh dấu học sinh thành trạng thái "Chuyển trường" và khóa tài khoản đăng nhập của học sinh.
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Trường chuyển đến <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={truongMoi}
                onChange={(e) => setTruongMoi(e.target.value)}
                placeholder="Nhập tên trường chuyển đến..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => setTransferSchoolModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!truongMoi.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm disabled:opacity-50 transition-colors"
            >
              Xác nhận chuyển
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
