import { useState, useRef, useEffect } from "react";
import { compareClassesByName } from "./hocSinhUtils.js";

export default function HocSinhFilters({
  searchInput,
  setSearchInput,
  handleSearch,
  gradeFilter,
  handleGradeSelect,
  classFilter,
  handleClassSelect,
  classesByGrade,
  filteredClasses,
  openCreate,
  setExcelModalOpen
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasFilter = gradeFilter !== "all" || classFilter !== "all";

  return (
    <div className="users-actions" style={{ flexWrap: "nowrap" }}>
      <div className="dash-search users-search">
        <span className="dot" />
        <input
          placeholder="Tìm theo tên hoặc lớp (SĐT nhập đủ 10 số)"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") handleSearch(); }}
        />
        <button className="btn-outline btn-sm" onClick={handleSearch} type="button">
          Tìm
        </button>
      </div>

      <div className="filter-dropdown-wrap" ref={filterRef}>
        <button
          type="button"
          className={`btn-outline filter-toggle ${hasFilter ? "filter-active" : ""}`}
          onClick={() => setFilterOpen((v) => !v)}
          title="Lọc"
        >
          <span className="material-symbols-outlined">filter_list</span>
          {hasFilter && <span className="filter-dot" />}
        </button>

        {filterOpen && (
          <div className="filter-dropdown">
            <div className="filter-dropdown-title">Lọc danh sách</div>
            <label className="filter-dropdown-label">
              <span>Khối</span>
              <select
                value={gradeFilter}
                onChange={(event) => handleGradeSelect(event.target.value)}
              >
                <option value="all">Tất cả khối</option>
                {classesByGrade.map((group) => (
                  <option key={group.grade} value={group.grade}>
                    Khối {group.grade}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-dropdown-label">
              <span>Lớp</span>
              <select
                value={classFilter}
                onChange={(event) => handleClassSelect(event.target.value)}
              >
                <option value="all">Tất cả lớp</option>
                {filteredClasses
                  .slice()
                  .sort(compareClassesByName)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.tenLop}
                    </option>
                  ))}
              </select>
            </label>
            {(gradeFilter !== "all" || classFilter !== "all") && (
              <button
                type="button"
                className="filter-clear"
                onClick={() => {
                  handleGradeSelect("all");
                  handleClassSelect("all");
                }}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      <button className="btn-primary" onClick={openCreate}>
        Thêm học sinh
      </button>
      <button className="btn-outline" onClick={() => setExcelModalOpen(true)} style={{ fontWeight: 700 }}>
        Nhập từ Excel
      </button>
    </div>
  );
}
