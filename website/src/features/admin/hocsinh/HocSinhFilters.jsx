import { Filter } from "lucide-react";
import { sortClasses } from "../../../utils/helpers.js";

export default function HocSinhFilters({ hooks }) {
  const {
    filterMenuRef, filterMenuOpen, setFilterMenuOpen,
    yearFilter, setYearFilter, academicYears,
    gradeFilter, setGradeFilter,
    classFilter, handleClassSelect,
    classesByGrade, filteredClasses
  } = hooks;

  const activeFilterCount =
    (yearFilter !== "all" ? 1 : 0) +
    (gradeFilter !== "all" ? 1 : 0) +
    (classFilter !== "all" ? 1 : 0);

  return (
    <div className="relative" ref={filterMenuRef}>
      <button
        onClick={() => setFilterMenuOpen(!filterMenuOpen)}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
          filterMenuOpen || activeFilterCount > 0
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Bộ lọc</span>
        {activeFilterCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 ml-1 text-[11px] font-bold text-white bg-blue-600 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {filterMenuOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-900">Lọc học sinh</h3>
            {activeFilterCount > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                {activeFilterCount} điều kiện
              </span>
            )}
          </div>
          <div className="p-4 space-y-3.5">
            {/* Năm học */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Năm học</label>
              <select
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                }}
                className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
              >
                <option value="all">Tất cả năm học</option>
                {(academicYears || []).map((yr) => (
                  <option key={yr} value={yr}>
                    Năm học {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Khối học */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khối học</label>
              <select
                value={gradeFilter}
                onChange={(e) => {
                  setGradeFilter(e.target.value);
                }}
                className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
              >
                <option value="all">Tất cả khối</option>
                {classesByGrade.map((group) => (
                  <option key={group.grade} value={group.grade}>
                    Khối {group.grade}
                  </option>
                ))}
              </select>
            </div>

            {/* Lớp học */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lớp học</label>
              <select
                value={classFilter}
                onChange={(e) => {
                  handleClassSelect(e.target.value);
                }}
                className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
              >
                <option value="all">Tất cả lớp</option>
                {filteredClasses
                  .slice()
                  .sort(sortClasses)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.tenLop} {item.namHoc ? `(${item.namHoc})` : ""}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              onClick={() => {
                setYearFilter("all");
                setGradeFilter("all");
                handleClassSelect("all");
              }}
              className="text-sm text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 transition-colors"
            >
              Xóa lọc
            </button>
            <button
              onClick={() => setFilterMenuOpen(false)}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
