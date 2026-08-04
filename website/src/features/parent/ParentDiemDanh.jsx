import { useEffect, useMemo, useState } from "react";
import Header from "../../components/common/Header.jsx";
import { getStudentStatistics } from "../../api/diemdanhApi.js";
import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";

const STATUS_MAP = {
  CO_MAT: { label: "Có mặt", color: "text-green-700 bg-green-50" },
  CO_PHEP: { label: "Vắng có phép", color: "text-yellow-700 bg-yellow-50" },
  KHONG_PHEP: { label: "Vắng không phép", color: "text-red-700 bg-red-50" },
};

export default function ParentDiemDanh() {
  const { students, currentStudent, selectedIndex, selectStudent, loading: studentsLoading } = useParentStudents();
  const [statistics, setStatistics] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Set default date range
  useEffect(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    setFromDate(from.toISOString().slice(0, 10));
    setToDate(now.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!currentStudent?.id || !fromDate || !toDate) return;
    let active = true;

    const fetchStats = async () => {
      try {
        setDataLoading(true);
        setError("");
        const statsRes = await getStudentStatistics(currentStudent.id, fromDate, toDate);
        if (!active) return;
        setStatistics(statsRes?.data?.data || null);
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu điểm danh.");
      } finally {
        if (active) setDataLoading(false);
      }
    };

    fetchStats();
    return () => { active = false; };
  }, [currentStudent?.id, fromDate, toDate]);

  const loading = studentsLoading || dataLoading;

  const stats = useMemo(() => {
    if (!statistics) return { total: 0, coMat: 0, vangCoPhep: 0, vangKhongPhep: 0, diTre: 0 };
    return {
      total: statistics.totalDays ?? statistics.total ?? 0,
      coMat: statistics.present ?? statistics.coMat ?? 0,
      vangCoPhep: statistics.excusedAbsent ?? statistics.vangCoPhep ?? 0,
      vangKhongPhep: statistics.unexcusedAbsent ?? statistics.vangKhongPhep ?? 0,
      diTre: statistics.late ?? statistics.diTre ?? 0
    };
  }, [statistics]);

  const attendanceRate = stats.total > 0 ? ((stats.coMat / stats.total) * 100).toFixed(1) : "--";

  return (
    <div className="flex-1 bg-white min-h-screen">
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4 border-b border-slate-200 shrink-0">
        <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-3">
          Điểm danh con em
        </h2>
        <div className="flex items-center justify-between mt-2">
          <p className="text-slate-500 text-[14px]">
            Theo dõi tình hình đi học của con.
          </p>
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-full border border-slate-200 inline-flex items-center gap-2 shadow-sm">
              <div className="flex items-center gap-2 pl-3 pr-1">
                <span className="text-xs font-medium text-slate-500">Từ</span>
                <input 
                  type="date" 
                  className="text-sm bg-transparent border-none outline-none font-semibold text-slate-700 cursor-pointer"
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)} 
                />
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              <div className="flex items-center gap-2 pr-3 pl-1">
                <span className="text-xs font-medium text-slate-500">Đến</span>
                <input 
                  type="date" 
                  className="text-sm bg-transparent border-none outline-none font-semibold text-slate-700 cursor-pointer"
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)} 
                />
              </div>
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-100 h-[34px] flex items-center">
              {loading ? "..." : attendanceRate}% đi học
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pt-2">
        <div className="mb-6">
          <StudentSelector students={students} selectedIndex={selectedIndex} onSelect={selectStudent} />
        </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-center border border-red-100">{error}</div>
      ) : loading && !statistics ? (
        <div className="p-12 text-center text-slate-400">Đang tải...</div>
      ) : !statistics ? (
        <div className="bg-slate-50 text-slate-500 p-8 rounded-2xl mb-6 text-center border border-slate-100">Chưa có dữ liệu điểm danh.</div>
      ) : null}

      {/* Only show these if we have valid statistics */}
      {!error && statistics && (
        <>
          <div className="border-b border-gray-200 pb-4 mb-6 mt-4">
            <h2 className="text-xl font-bold text-slate-800">Chi tiết điểm danh</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {statistics.details && statistics.details.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Ngày</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Trạng thái</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statistics.details.map((item, idx) => {
                      const status = STATUS_MAP[item.trangThai] || STATUS_MAP.CO_MAT;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-700">
                            {item.ngayDiemDanh ? new Date(item.ngayDiemDanh).toLocaleDateString("vi-VN") : "--"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`${status.color} px-3 py-1 rounded-full text-sm font-medium`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{item.ghiChu || "--"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 flex flex-col items-center justify-center text-gray-400 gap-3">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                  <i className="fi fi-rr-document text-2xl"></i>
                </div>
                <p>Chưa có chi tiết điểm danh nào</p>
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
