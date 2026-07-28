import { useState, useEffect, useMemo, useRef } from "react";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import Pagination from "../../../components/common/Pagination.jsx";

import { getAuditLogs } from "../../../api/auditLogApi.js";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

const DEFAULT_PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(raw) {
  if (!raw) return { date: "—", time: "—" };
  const d = new Date(raw);
  const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

function getActionMeta(action) {
  const map = {
    INSERT: { label: "Thêm mới",   bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    UPDATE: { label: "Chỉnh sửa",  bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
    DELETE: { label: "Xóa",        bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"     },
    LOGIN:  { label: "Đăng nhập",  bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
    LOGOUT: { label: "Đăng xuất",  bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200"   },
  };
  return map[action] || { label: action || "Khác", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };
}

function initials(name = "") {
  return name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function Avatar({ name, color = "bg-blue-600" }) {
  return (
    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${color} text-[11px] font-bold text-white`}>
      {initials(name)}
    </div>
  );
}

function ActionBadge({ action }) {
  const meta = getActionMeta(action);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.bg} ${meta.text} ${meta.border}`}>
      {meta.label}
    </span>
  );
}

function ScoreChange({ oldVal, newVal, action }) {
  const hasOld = oldVal != null && oldVal !== "";
  const hasNew = newVal != null && newVal !== "";
  const arrowColor = action === "DELETE" ? "#ef4444" : action === "INSERT" ? "#16a34a" : "#f59e0b";
  return (
    <div className="flex items-center justify-center gap-1.5 text-sm font-semibold tabular-nums">
      <span className={hasOld ? "text-slate-500 line-through" : "text-slate-300"}>
        {hasOld ? oldVal : "—"}
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={arrowColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
      <span className={hasNew ? (action === "DELETE" ? "text-red-500" : "text-emerald-600 font-bold") : "text-slate-300"}>
        {hasNew ? newVal : "—"}
      </span>
    </div>
  );
}

// ─── Stat Card removed by user request ───

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AuditLogPage({ isEmbedded = false, logType = "all" }) {
  const [logs, setLogs] = useState([]);
  const [giaoViens, setGiaoViens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [exportOpen, setExportOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const exportRef = useRef(null);
  const filterRef = useRef(null);

  const [filters, setFilters] = useState({ giaoVienId: "", startDate: "", endDate: "", hanhDong: "" });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchData = async (f = appliedFilters) => {
    setLoading(true);
    try {
      const logRes = await getAuditLogs({
        giaoVienId: f.giaoVienId || undefined,
        startDate: f.startDate ? `${f.startDate}T00:00:00` : undefined,
        endDate: f.endDate ? `${f.endDate}T23:59:59` : undefined,
      });
      setLogs(logRes?.data?.data || []);
    } catch {
      notifyError("Không thể tải dữ liệu nhật ký.");
    } finally {
      setLoading(false);
    }
    try {
      const gvRes = await getGiaoVien();
      setGiaoViens(gvRes?.data?.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchData(appliedFilters); }, []);

  const handleApply = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
    setFilterOpen(false);
    fetchData(filters);
  };

  const handleReset = () => {
    const blank = { giaoVienId: "", startDate: "", endDate: "", hanhDong: "" };
    setFilters(blank);
    setAppliedFilters(blank);
    setPage(1);
    setFilterOpen(false);
    fetchData(blank);
  };

  // Count active filters
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  // Client-side filter: hanhDong only (giaoVienId + dates handled server-side)
  const filteredLogs = useMemo(() => {
    let r = [...logs];
    if (logType === "system") {
      r = r.filter((l) => l.hanhDong !== "LOGIN" && l.hanhDong !== "LOGOUT");
    } else if (logType === "login") {
      r = r.filter((l) => l.hanhDong === "LOGIN" || l.hanhDong === "LOGOUT");
    }
    if (appliedFilters.hanhDong) r = r.filter((l) => l.hanhDong === appliedFilters.hanhDong);
    r.sort((a, b) => new Date(b.thoiGian) - new Date(a.thoiGian));
    return r;
  }, [logs, appliedFilters.hanhDong, logType]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const pagedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  // ── Export ──
  const buildCSV = () => {
    const header = "Thời gian,Hành động,Giáo viên,Học sinh,Môn học,Giá trị cũ,Giá trị mới\n";
    const rows = filteredLogs.map((log) => {
      const { date, time } = formatDateTime(log.thoiGian);
      return `"${date} ${time}","${log.hanhDong || ""}","${log.giaoVien?.hoTen || ""}","${log.hocSinh?.hoTen || ""}","${log.monHoc?.tenMon || ""}","${log.giaTriCu ?? ""}","${log.giaTriMoi ?? ""}"`;
    });
    return "\uFEFF" + header + rows.join("\n");
  };

  const exportCSV = () => {
    if (!filteredLogs.length) { notifyError("Không có dữ liệu để xuất."); return; }
    const blob = new Blob([buildCSV()], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    notifySuccess("Đã xuất CSV thành công!"); setExportOpen(false);
  };

  const exportJSON = () => {
    if (!filteredLogs.length) { notifyError("Không có dữ liệu để xuất."); return; }
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    notifySuccess("Đã xuất JSON thành công!"); setExportOpen(false);
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      {/* Filter Dropdown */}
      <div className="relative" ref={filterRef}>
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className={`relative flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold shadow-sm transition-all ${filterOpen || activeFilterCount > 0 ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
        >
          {/* Funnel SVG */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {filterOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-700">Bộ lọc</p>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Từ ngày</label>
                <input type="date" value={filters.startDate}
                  onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Đến ngày</label>
                <input type="date" value={filters.endDate}
                  onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Giáo viên</label>
                <select value={filters.giaoVienId}
                  onChange={(e) => setFilters((f) => ({ ...f, giaoVienId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="">Tất cả giáo viên</option>
                  {giaoViens.map((gv) => (
                    <option key={gv.id} value={gv.id}>{gv.hoTen}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Hành động</label>
                <select value={filters.hanhDong}
                  onChange={(e) => setFilters((f) => ({ ...f, hanhDong: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="">Tất cả</option>
                  {logType === "login" ? (
                    <>
                      <option value="LOGIN">Đăng nhập</option>
                      <option value="LOGOUT">Đăng xuất</option>
                    </>
                  ) : (
                    <>
                      <option value="INSERT">Thêm mới</option>
                      <option value="UPDATE">Chỉnh sửa</option>
                      <option value="DELETE">Xóa</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 p-3">
              <button onClick={handleReset}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                Đặt lại
              </button>
              <button onClick={handleApply}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-all active:scale-95">
                Áp dụng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export Dropdown */}
      <div className="relative" ref={exportRef}>
        <button type="button" onClick={() => setExportOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
          <MaterialIcon name="download" style={{ fontSize: 18 }} />
          Xuất
          <MaterialIcon name="expand_more" style={{ fontSize: 16 }} />
        </button>
        {exportOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <button onClick={exportCSV} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">CSV</button>
            <button onClick={exportJSON} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">JSON</button>
          </div>
        )}
      </div>

      {/* Refresh */}
      <button type="button" onClick={() => fetchData(appliedFilters)}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all active:scale-95">
        <MaterialIcon name="refresh" style={{ fontSize: 18 }} />
        Làm mới
      </button>
    </div>
  );

  return (
    <div className={isEmbedded ? "space-y-5 p-1" : "space-y-5"}>
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        {headerActions}
      </div>

      {/* ── TABLE ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-slate-100 bg-slate-50/90 backdrop-blur">
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Thời gian</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Hành động</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">{logType === "login" ? "Tài khoản" : "Giáo viên"}</th>
                    {logType !== "login" && (
                      <>
                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Học sinh</th>
                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Môn học</th>
                        <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Thay đổi</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pagedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <MaterialIcon name="history" style={{ fontSize: 48, opacity: 0.3 }} />
                          <p className="text-sm">Chưa có nhật ký nào.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagedLogs.map((log, i) => {
                      const { date, time } = formatDateTime(log.thoiGian);
                      return (
                        <tr key={log.id || i}
                          className={`border-b border-slate-50 transition-colors hover:bg-blue-50/40 ${i % 2 !== 0 ? "bg-slate-50/40" : ""}`}>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="font-semibold text-slate-700">{date}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{time}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <ActionBadge action={log.hanhDong} />
                          </td>
                          <td className="px-5 py-3.5">
                            {logType === "login" ? (
                              log.giaoVien?.hoTen ? (
                                <div className="flex items-center gap-2">
                                  <Avatar name={log.giaoVien.hoTen} color="bg-blue-500" />
                                  <span className="font-medium text-slate-700">{log.giaoVien.hoTen}</span>
                                </div>
                              ) : log.hocSinh?.hoTen ? (
                                <div className="flex items-center gap-2">
                                  <Avatar name={log.hocSinh.hoTen} color="bg-violet-500" />
                                  <span className="font-medium text-slate-700">{log.hocSinh.hoTen}</span>
                                </div>
                              ) : <span className="text-slate-300">—</span>
                            ) : (
                              log.giaoVien?.hoTen ? (
                                <div className="flex items-center gap-2">
                                  <Avatar name={log.giaoVien.hoTen} color="bg-blue-500" />
                                  <span className="font-medium text-slate-700">{log.giaoVien.hoTen}</span>
                                </div>
                              ) : <span className="text-slate-300">—</span>
                            )}
                          </td>
                          {logType !== "login" && (
                            <td className="px-5 py-3.5">
                              {log.hocSinh?.hoTen ? (
                                <div className="flex items-center gap-2">
                                  <Avatar name={log.hocSinh.hoTen} color="bg-violet-500" />
                                  <span className="font-medium text-slate-700">{log.hocSinh.hoTen}</span>
                                </div>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                          )}
                          {logType !== "login" && (
                            <td className="px-5 py-3.5">
                              {log.monHoc?.tenMon ? (
                                <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                  {log.monHoc.tenMon}
                                </span>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                          )}
                          {logType !== "login" && (
                            <td className="px-5 py-3.5">
                              <ScoreChange oldVal={log.giaTriCu} newVal={log.giaTriMoi} action={log.hanhDong} />
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── PAGINATION ──────────────────────────────────────────── */}
            {filteredLogs.length > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredLogs.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setPage(1);
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
