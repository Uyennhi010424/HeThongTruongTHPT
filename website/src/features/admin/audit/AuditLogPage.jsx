import { useState, useEffect, useMemo } from "react";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getAuditLogs } from "../../../api/auditLogApi.js";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

const PAGE_SIZE = 20;

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [giaoViens, setGiaoViens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ giaoVienId: "", startDate: "", endDate: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const logRes = await getAuditLogs({
        giaoVienId: filters.giaoVienId || undefined,
        startDate: filters.startDate ? `${filters.startDate}T00:00:00` : undefined,
        endDate: filters.endDate ? `${filters.endDate}T23:59:59` : undefined
      });
      setLogs(logRes?.data?.data || []);
    } catch {
      notifyError("Không thể tải dữ liệu nhật ký.");
    } finally {
      setLoading(false);
    }
    // Tải danh sách giáo viên riêng — lỗi không ảnh hưởng audit log
    try {
      const gvRes = await getGiaoVien();
      setGiaoViens(gvRes?.data?.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const logRes = await getAuditLogs();
        if (!active) return;
        setLogs(logRes?.data?.data || []);
      } catch {
        if (active) notifyError("Không thể tải dữ liệu nhật ký.");
      } finally {
        if (active) setLoading(false);
      }
      // Tải danh sách giáo viên riêng — lỗi không ảnh hưởng audit log
      try {
        const gvRes = await getGiaoVien();
        if (active) setGiaoViens(gvRes?.data?.data || []);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, []);

  const handleFilter = () => {
    setPage(1);
    fetchData();
  };

  const handleRefresh = () => {
    setFilters({ giaoVienId: "", startDate: "", endDate: "" });
    setPage(1);
    fetchData();
  };

  const handleExportCSV = () => {
    if (!logs.length) {
      notifyError("Không có dữ liệu để xuất.");
      return;
    }
    const header = "Thời gian,Hành động,Giáo viên,Học sinh,Môn học,Giá trị cũ,Giá trị mới\n";
    const rows = logs.map((log) => {
      const time = log.thoiGian ? new Date(log.thoiGian).toLocaleString("vi-VN") : "";
      const action = log.hanhDong || "";
      const gv = log.giaoVien?.hoTen || "";
      const hs = log.hocSinh?.hoTen || "";
      const mon = log.monHoc?.tenMon || "";
      const old = log.giaTriCu ?? "";
      const neu = log.giaTriMoi ?? "";
      return `"${time}","${action}","${gv}","${hs}","${mon}","${old}","${neu}"`;
    });
    const csv = "﻿" + header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess("Đã xuất file CSV thành công!");
  };

  const filteredLogs = useMemo(() => {
    let result = [...logs];
    if (filters.giaoVienId) {
      result = result.filter((l) => l.giaoVien?.id === Number(filters.giaoVienId));
    }
    result.sort((a, b) => new Date(b.thoiGian) - new Date(a.thoiGian));
    return result;
  }, [logs, filters.giaoVienId]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pagedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const getActionLabel = (action) => {
    const map = { INSERT: "Thêm mới", UPDATE: "Cập nhật", DELETE: "Xóa" };
    return map[action] || action;
  };

  const getActionColor = (action) => {
    const map = { INSERT: "text-green-600", UPDATE: "text-primary", DELETE: "text-error" };
    return map[action] || "text-on-surface";
  };

  return (
    <div className="space-y-lg">
      <PageHeader
        title="Nhật ký Hệ thống"
        description="Theo dõi lịch sử thay đổi dữ liệu, đặc biệt là điểm số và hồ sơ học sinh."
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-xs rounded-xl bg-surface-container-highest px-lg py-sm font-label-md text-on-surface transition-all hover:bg-surface-variant"
            >
              <MaterialIcon name="download" />
              Xuất báo cáo (CSV)
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-xs rounded-xl bg-primary px-lg py-sm font-label-md text-on-primary shadow-md transition-all active:scale-[0.98]"
            >
              <MaterialIcon name="refresh" />
              Làm mới dữ liệu
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="grid grid-cols-12 gap-lg">
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-lg shadow-card lg:col-span-4">
          <label className="mb-sm block font-label-md text-on-surface">Thời gian</label>
          <div className="flex gap-sm">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
              className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low p-3 font-body-sm"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
              className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low p-3 font-body-sm"
            />
          </div>
        </div>
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-lg shadow-card lg:col-span-3">
          <label className="mb-sm block font-label-md text-on-surface">Giáo viên</label>
          <select
            value={filters.giaoVienId}
            onChange={(e) => setFilters((f) => ({ ...f, giaoVienId: e.target.value }))}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-3 font-body-sm"
          >
            <option value="">Tất cả giáo viên</option>
            {giaoViens.map((gv) => (
              <option key={gv.id} value={gv.id}>
                {gv.hoTen} ({gv.boMon})
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-12 flex items-end pb-lg lg:col-span-2">
          <button
            type="button"
            onClick={handleFilter}
            className="w-full rounded-xl bg-secondary-container py-sm font-bold text-on-secondary-container hover:opacity-90"
          >
            Lọc dữ liệu
          </button>
        </div>
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-card">
        {loading ? (
          <div className="flex items-center justify-center py-3xl">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-high font-label-md text-on-surface">
                    <th className="px-lg py-md">Thời gian</th>
                    <th className="px-lg py-md">Hành động</th>
                    <th className="px-lg py-md">Giáo viên</th>
                    <th className="px-lg py-md">Học sinh</th>
                    <th className="px-lg py-md">Môn học</th>
                    <th className="px-lg py-md text-center">Cũ</th>
                    <th className="px-lg py-md text-center">Mới</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {pagedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-lg py-3xl text-center text-on-surface-variant">
                        Chưa có nhật ký nào. Hãy thay đổi điểm số để tạo dữ liệu.
                      </td>
                    </tr>
                  ) : (
                    pagedLogs.map((log, i) => (
                      <tr key={log.id || i} className="transition-colors hover:bg-surface-container-low">
                        <td className="px-lg py-md font-body-sm">
                          <div className="font-bold">
                            {log.thoiGian ? new Date(log.thoiGian).toLocaleTimeString("vi-VN") : "—"}
                          </div>
                          <div className="text-on-surface-variant">
                            {log.thoiGian ? new Date(log.thoiGian).toLocaleDateString("vi-VN") : ""}
                          </div>
                        </td>
                        <td className="px-lg py-md">
                          <span className={`font-label-md font-bold ${getActionColor(log.hanhDong)}`}>
                            {getActionLabel(log.hanhDong)}
                          </span>
                        </td>
                        <td className="px-lg py-md font-label-md">{log.giaoVien?.hoTen || "—"}</td>
                        <td className="px-lg py-md font-label-md">{log.hocSinh?.hoTen || "—"}</td>
                        <td className="px-lg py-md">
                          <span className="rounded bg-secondary-container/10 px-sm py-xs text-[12px] font-bold text-on-secondary-container">
                            {log.monHoc?.tenMon || "—"}
                          </span>
                        </td>
                        <td className="px-lg py-md text-center font-bold text-error">
                          {log.giaTriCu != null ? log.giaTriCu : "—"}
                        </td>
                        <td className="px-lg py-md text-center font-bold text-primary">
                          {log.giaTriMoi != null ? log.giaTriMoi : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredLogs.length > 0 && (
              <div className="flex flex-col items-center justify-between gap-sm border-t border-outline-variant bg-surface-container-low px-lg py-md sm:flex-row">
                <p className="text-body-sm text-on-surface-variant">
                  Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)} trong {filteredLogs.length} bản ghi
                </p>
                <div className="flex items-center gap-xs">
                  <button type="button" onClick={() => setPage(1)} disabled={page === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant disabled:cursor-default disabled:opacity-30">
                    <MaterialIcon name="first_page" />
                  </button>
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant disabled:cursor-default disabled:opacity-30">
                    <MaterialIcon name="chevron_left" />
                  </button>
                  {getPageNumbers().map((item, i) =>
                    item === "..." ? (
                      <span key={`d${i}`} className="flex h-9 w-9 items-center justify-center text-on-surface-variant">…</span>
                    ) : (
                      <button key={item} type="button" onClick={() => setPage(item)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sm transition-colors ${
                          page === item ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-variant"
                        }`}>
                        {item}
                      </button>
                    )
                  )}
                  <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant disabled:cursor-default disabled:opacity-30">
                    <MaterialIcon name="chevron_right" />
                  </button>
                  <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant disabled:cursor-default disabled:opacity-30">
                    <MaterialIcon name="last_page" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
