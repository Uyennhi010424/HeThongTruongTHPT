import React, { useState } from "react";
import { Download, X } from "lucide-react";

export default function HocSinhExportModal({ hooks }) {
  const [exportType, setExportType] = useState("CLASS");
  const [selectedClass, setSelectedClass] = useState("");

  if (!hooks.exportModalOpen) return null;

  const handleExport = () => {
    hooks.executeExportExcel(exportType, selectedClass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" />
            Tùy chọn xuất Excel
          </h3>
          <button
            onClick={() => hooks.setExportModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 cursor-pointer transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
              <input
                type="radio"
                name="exportType"
                value="CLASS"
                checked={exportType === "CLASS"}
                onChange={(e) => setExportType(e.target.value)}
                className="mt-1 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-600"
              />
              <div className="flex-1">
                <span className="block text-sm font-semibold text-slate-900">Xuất danh sách theo lớp</span>
                <span className="block text-xs text-slate-500 mt-0.5">Chọn một lớp cụ thể để xuất thành 1 sheet duy nhất.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 cursor-pointer transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
              <input
                type="radio"
                name="exportType"
                value="ALL"
                checked={exportType === "ALL"}
                onChange={(e) => setExportType(e.target.value)}
                className="mt-1 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-600"
              />
              <div className="flex-1">
                <span className="block text-sm font-semibold text-slate-900">Xuất tất cả các lớp</span>
                <span className="block text-xs text-slate-500 mt-0.5">Xuất toàn bộ học sinh, mỗi lớp sẽ là 1 sheet riêng biệt trong file.</span>
              </div>
            </label>
          </div>

          {exportType === "CLASS" && (
            <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <label className="block text-sm font-semibold text-slate-700">Chọn lớp cần xuất</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="">-- Chọn lớp --</option>
                {hooks.classesByGrade.map((gradeGroup) => (
                  <optgroup key={gradeGroup.grade} label={`Khối ${gradeGroup.grade}`}>
                    {gradeGroup.items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tenLop}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button
            onClick={() => hooks.setExportModalOpen(false)}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
          >
            Xuất Excel
          </button>
        </div>
      </div>
    </div>
  );
}
