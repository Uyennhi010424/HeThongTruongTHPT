import { useRef, useState, useEffect } from "react";

export default function TeacherFilter({ 
  filters, 
  showGrade = true,
  showClass = true,
  showSubject = true 
}) {
  const {
    namHocList,
    availableGrades,
    filteredClasses,
    allowedSubjects,
    selectedNamHoc,
    setSelectedNamHoc,
    selectedSemester,
    setSelectedSemester,
    selectedGrade,
    setSelectedGrade,
    selectedClassId,
    setSelectedClassId,
    selectedSubjectId,
    setSelectedSubjectId,
    resetFilters
  } = filters;

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    if (!filterOpen) return;
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filterOpen]);

  const hasActiveFilters = 
    selectedSemester !== "HK1" || 
    (showGrade && selectedGrade !== "all") || 
    (showClass && selectedClassId) ||
    (showSubject && selectedSubjectId);

  const inputClassFilter = "w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700";

  return (
    <div className="relative w-fit" ref={filterRef}>
      <button
        type="button"
        className={`relative flex items-center justify-center w-[40px] h-[40px] rounded-[10px] border transition-all ${
          hasActiveFilters 
            ? "bg-blue-50 border-blue-200 text-blue-700" 
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
        onClick={() => setFilterOpen((v) => !v)}
      >
        <span className="material-symbols-outlined text-[20px]">filter_list</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-2 right-2" />
        )}
      </button>

      {filterOpen && (
        <div className="absolute right-0 mt-2 w-[340px] bg-white rounded-xl shadow-xl border border-slate-200 p-5 z-50 flex flex-col gap-4">
          <div className="text-[15px] font-bold text-slate-800 border-b border-slate-100 pb-3 flex justify-between items-center">
            <span>Lọc danh sách</span>
            {(hasActiveFilters) && (
              <button type="button" className="text-[12px] font-semibold text-red-600 hover:text-red-700" onClick={resetFilters}>
                Xóa lọc
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-slate-600">Năm học</span>
              <select className={inputClassFilter} value={selectedNamHoc} onChange={(e) => setSelectedNamHoc(e.target.value)}>
                {namHocList.length > 0 ? (
                  namHocList.map((year) => <option key={year} value={year}>{year}</option>)
                ) : (
                  <option value="">Đang tải...</option>
                )}
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-slate-600">Học kỳ</span>
              <select className={inputClassFilter} value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                <option value="HK1">Học kỳ I</option>
                <option value="HK2">Học kỳ II</option>
              </select>
            </div>
            
            {showGrade && (
              <div className="flex flex-col gap-1.5 col-span-2">
                <span className="text-[13px] font-semibold text-slate-600">Khối</span>
                <select className={inputClassFilter} value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                  <option value="all">Tất cả khối</option>
                  {availableGrades.map((grade) => (
                    <option key={String(grade)} value={String(grade)}>Khối {grade}</option>
                  ))}
                </select>
              </div>
            )}
            
            {showClass && (
              <div className="flex flex-col gap-1.5 col-span-2">
                <span className="text-[13px] font-semibold text-slate-600">Lớp</span>
                <select className={inputClassFilter} value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                  {filteredClasses.length === 0 ? (
                    <option value="">Không có lớp</option>
                  ) : (
                    filteredClasses.map((lop) => (
                      <option key={lop.id} value={String(lop.id)}>{lop.tenLop}</option>
                    ))
                  )}
                </select>
              </div>
            )}

            {showSubject && (
              <div className="flex flex-col gap-1.5 col-span-2">
                <span className="text-[13px] font-semibold text-slate-600">Môn học</span>
                <select className={inputClassFilter} value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)}>
                  {allowedSubjects.length === 0 ? (
                    <option value="">Không có môn</option>
                  ) : (
                    allowedSubjects.map((subject) => (
                      <option key={subject.id} value={String(subject.id)}>{subject.tenMon}</option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
