import { useHocSinhList } from "./useHocSinhList.js";
import { RefreshCw, Download, Plus, ChevronDown, Upload, Filter } from "lucide-react";
import HocSinhTable from "./HocSinhTable.jsx";
import HocSinhFilters from "./HocSinhFilters.jsx";
import HocSinhFormModal from "./HocSinhFormModal.jsx";
import HocSinhExcelImportModal from "./HocSinhExcelImportModal.jsx";
import HocSinhViewModal from "./HocSinhViewModal.jsx";
import HocSinhExportModal from "./HocSinhExportModal.jsx";

import HocSinhTransferClassModal from "./HocSinhTransferClassModal.jsx";
import HocSinhTransferSchoolModal from "./HocSinhTransferSchoolModal.jsx";

export default function HocSinhList() {
  const hooks = useHocSinhList();
  
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Danh mục học sinh</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Quản lý thông tin, lớp học và trạng thái học sinh.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <HocSinhFilters hooks={hooks} />

          <button 
            onClick={hooks.handleRefresh}
            className="inline-flex items-center justify-center w-[42px] h-[42px] bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 shadow-sm transition-colors duration-200"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${hooks.loading ? 'animate-spin' : ''}`} />
          </button>

          <button 
            onClick={() => hooks.setExportModalOpen(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-200 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <div className="relative" ref={hooks.addMenuRef}>
            <button 
              onClick={() => hooks.setAddMenuOpen(!hooks.addMenuOpen)}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm học sinh</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${hooks.addMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {hooks.addMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden py-1">
                <button
                  onClick={() => {
                    hooks.setAddMenuOpen(false);
                    hooks.openCreate();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Thêm thủ công
                </button>
                <button
                  onClick={() => {
                    hooks.setAddMenuOpen(false);
                    hooks.setExcelModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Thêm từ file Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <HocSinhTable hooks={hooks} />
      <HocSinhFormModal hooks={hooks} />
      <HocSinhExcelImportModal hooks={hooks} />
      <HocSinhExportModal hooks={hooks} />
      <HocSinhViewModal hooks={hooks} />
      <HocSinhTransferClassModal hooks={hooks} />
      <HocSinhTransferSchoolModal hooks={hooks} />
    </div>
  );
}

