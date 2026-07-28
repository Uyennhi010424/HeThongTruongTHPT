import { Filter } from "lucide-react";

export default function HocSinhFilters({ hooks }) {
  const {
    filterMenuRef, filterMenuOpen, setFilterMenuOpen,
    gradeFilter, setGradeFilter,
    classFilter, handleClassSelect,
    classesByGrade, filteredClasses
  } = hooks;

  return (
    <div className="relative" ref={filterMenuRef}>
      <button
        onClick={() => setFilterMenuOpen(!filterMenuOpen)}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
          filterMenuOpen || gradeFilter !== "all" || classFilter !== "all"
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Bộ lọc</span>
        {(gradeFilter !== "all" || classFilter !== "all") && (
          <span className="flex items-center justify-center w-5 h-5 ml-1 text-[11px] font-bold text-white bg-blue-600 rounded-full">
            {(gradeFilter !== "all" ? 1 : 0) + (classFilter !== "all" ? 1 : 0)}
          </span>
        )}
      </button>

      {filterMenuOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Lọc học sinh</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khối học</label>
              <select
                value={gradeFilter}
                onChange={(e) => {
                  setGradeFilter(e.target.value);
                  setFilterMenuOpen(false);
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lớp học</label>
              <select
                value={classFilter}
                onChange={(e) => {
                  handleClassSelect(e.target.value);
                  setFilterMenuOpen(false);
                }}
                className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
              >
                <option value="all">Tất cả lớp</option>
                {filteredClasses
                  .slice()
                  .sort((a, b) => String(a.tenLop || "").localeCompare(String(b.tenLop || ""), "vi", { sensitivity: "base" }))
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.tenLop}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              onClick={() => {
                setGradeFilter("all");
                handleClassSelect("all");
              }}
              className="text-sm text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 transition-colors"
            >
              Xóa lọc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
