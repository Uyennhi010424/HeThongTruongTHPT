import { X, ArrowRightLeft } from "lucide-react";
import { useState } from "react";

export default function HocSinhTransferClassModal({ hooks }) {
  const {
    transferClassModalOpen,
    setTransferClassModalOpen,
    transferringStudent,
    submitTransferClass,
    classesByGrade
  } = hooks;

  const [selectedLopId, setSelectedLopId] = useState("");

  if (!transferClassModalOpen || !transferringStudent) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    submitTransferClass(selectedLopId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Chuyển lớp</h2>
              <p className="text-sm font-medium text-slate-500">
                {transferringStudent.hoTen}
              </p>
            </div>
          </div>
          <button
            onClick={() => setTransferClassModalOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Lớp hiện tại
              </label>
              <input
                type="text"
                disabled
                value={transferringStudent.lop?.tenLop || "--"}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Chọn lớp chuyển đến <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedLopId}
                onChange={(e) => setSelectedLopId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700"
              >
                <option value="">-- Chọn lớp mới --</option>
                {classesByGrade
                  .filter(({ grade }) => {
                    const studentGrade = transferringStudent.lop?.khoi ? String(transferringStudent.lop.khoi) : null;
                    return !studentGrade || grade === studentGrade;
                  })
                  .map(({ grade, items }) => (
                  <optgroup key={grade} label={`Khối ${grade}`}>
                    {items.map((lop) => (
                      <option key={lop.id} value={lop.id} disabled={lop.id === transferringStudent.lop?.id}>
                        {lop.tenLop}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => setTransferClassModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!selectedLopId}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition-colors"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
