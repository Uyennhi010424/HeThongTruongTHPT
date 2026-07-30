import React, { useEffect, useMemo, useState } from "react";
import { getCurrentGiaoVien } from "../../api/giaovienApi.js";
import { getPhanCongDay } from "../../api/phancongDayApi.js";
import { getTeacherSummary } from "../../api/diemApi.js";
import { getLop } from "../../api/lopApi.js";
import { getMonHoc } from "../../api/monhocApi.js";
import { getNamHoc } from "../../api/namhocApi.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download, RefreshCw, ChevronDown, ChevronUp, Filter } from "lucide-react";

export default function TeacherReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teacher, setTeacher] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [classStats, setClassStats] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [namHocList, setNamHocList] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [teacherRes, phanCongRes, lopRes, monHocRes, namHocRes] = await Promise.all([
          getCurrentGiaoVien(),
          getPhanCongDay(),
          getLop(),
          getMonHoc(),
          getNamHoc().catch(() => null)
        ]);

        if (!active) return;

        const gv = teacherRes?.data?.data;
        setTeacher(gv);
        setClasses(lopRes?.data?.data || []);
        const rawSubjects = monHocRes?.data?.data || [];
        const filteredSubjects = rawSubjects.filter(s => {
          const name = (s.tenMon || "").toLowerCase();
          return !name.includes("shdc") && !name.includes("sinh hoạt lớp");
        });
        setSubjects(filteredSubjects);

        const allNamHoc = namHocRes?.data?.data || [];
        const years = allNamHoc
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean)
          .sort((a, b) => {
            const yearA = Number(String(a).match(/(\d{4})/)?.[1] || 0);
            const yearB = Number(String(b).match(/(\d{4})/)?.[1] || 0);
            return yearB - yearA;
          });
        setNamHocList(years);
        const activeYear = allNamHoc.find((y) => y.trangThai === "DANG_MO");
        const currentNamHoc = activeYear?.tenNamHoc || years[0] || "";
        setSelectedNamHoc((prev) => prev || currentNamHoc);

        const allPhanCong = phanCongRes?.data?.data || [];
        const myAssignments = gv?.id
          ? allPhanCong.filter((pc) => {
              const pcTeacherId = pc?.giaoVienId ?? pc?.giaoVien?.id;
              return Number(pcTeacherId) === Number(gv.id);
            })
          : [];
        setAssignments(myAssignments);
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu thống kê.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedNamHoc || !teacher?.id) return;
    let active = true;
    const loadTeacherSummary = async () => {
      try {
        const res = await getTeacherSummary({ namHoc: selectedNamHoc, giaoVienId: teacher.id });
        if (!active) return;
        
        const stats = (res?.data?.data || []).map(s => ({
          ...s,
          avg: s.avg !== null ? Number(s.avg).toFixed(1) : "--",
          tot: Number(s.tot || 0),
          kha: Number(s.kha || 0),
          dat: Number(s.dat || 0),
          chuaDat: Number(s.chuaDat || 0),
          siSo: Number(s.siSo || 0),
          totalScores: Number(s.totalScores || 0)
        })).sort((a, b) => String(a.tenLop).localeCompare(String(b.tenLop), "vi", { numeric: true }));
        
        setClassStats(stats);
      } catch (err) {
        if (!active) return;
        console.error("Lỗi tải điểm:", err);
        setError("Không thể tải dữ liệu điểm. Vui lòng làm mới trang.");
      }
    };
    loadTeacherSummary();
    return () => { active = false; };
  }, [selectedNamHoc, teacher?.id]);

  // classStats is now directly loaded from the optimized backend API

  const chartData = useMemo(() => {
    return classStats.map(c => {
      const total = c.tot + c.kha + c.dat + c.chuaDat;
      if (total === 0) return { name: c.tenLop, Tot: 0, Kha: 0, Dat: 0, ChuaDat: 0, total: 0 };
      return {
        name: c.tenLop,
        Tot: Number(((c.tot / total) * 100).toFixed(1)),
        Kha: Number(((c.kha / total) * 100).toFixed(1)),
        Dat: Number(((c.dat / total) * 100).toFixed(1)),
        ChuaDat: Number(((c.chuaDat / total) * 100).toFixed(1)),
        total
      };
    });
  }, [classStats]);

  const toggleRow = (classId) => {
    setExpandedRow(expandedRow === classId ? null : classId);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-md text-sm">
          <p className="font-bold text-slate-800 mb-2">Lớp {label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-slate-600 mb-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span>{entry.name}: {entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 print:p-0 print:bg-white text-slate-800 font-sans">
      
      {/* 1. Header Compact */}
      <div className="bg-white border border-slate-200 rounded-t-xl px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Báo cáo thống kê kết quả học tập</h1>
          <p className="text-sm text-slate-500 mt-1">
            Giáo viên: <span className="font-semibold text-slate-700">{teacher?.hoTen || "--"}</span> 
            <span className="mx-2 text-slate-300">|</span> 
            Bộ môn: <span className="font-semibold text-slate-700">{teacher?.boMon || "--"}</span>
          </p>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-xl px-6 py-3 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-sm print-hidden">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">Năm học</label>
            <select 
              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-slate-50 text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              value={selectedNamHoc} 
              onChange={(e) => setSelectedNamHoc(e.target.value)}
            >
              {namHocList.length > 0 ? (
                namHocList.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))
              ) : (
                <option value="">Đang tải...</option>
              )}
            </select>
          </div>
          
          <div className="h-4 w-px bg-slate-300"></div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-md cursor-not-allowed opacity-70">
            <Filter size={14} /> Bộ lọc nâng cao
          </button>
        </div>
        <div className="flex items-center gap-2 print-hidden">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {!error && !loading && classStats.length === 0 && (
        <div className="bg-white border border-slate-200 text-slate-500 text-center py-10 rounded-xl mb-6 shadow-sm">
          Chưa có dữ liệu phân công hoặc điểm cho năm học này.
        </div>
      )}

      {/* 3. Bảng thống kê Zebra Table */}
        {!error && classStats.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 overflow-hidden print:overflow-visible">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse min-w-[800px] print:min-w-0">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-slate-200 text-sm font-semibold text-slate-600">
                  <th className="py-3 px-4 w-10 text-center"></th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4 text-right">Sĩ số</th>
                  <th className="py-3 px-4 text-right">Tổng bài điểm</th>
                  <th className="py-3 px-4 text-right">TB Lớp</th>
                  <th className="py-3 px-4 text-right text-emerald-600">Tốt (≥8.0)</th>
                  <th className="py-3 px-4 text-right text-blue-600">Khá (≥6.5)</th>
                  <th className="py-3 px-4 text-right text-amber-600">Đạt (≥5.0)</th>
                  <th className="py-3 px-4 text-right text-rose-600">Chưa đạt (&lt;5.0)</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {classStats.map((item, idx) => (
                  <React.Fragment key={item.classId}>
                    <tr 
                      onClick={() => toggleRow(item.classId)}
                      className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}
                    >
                      <td className="py-3 px-4 text-center text-slate-400">
                        {expandedRow === item.classId ? <ChevronUp size={16} className="mx-auto" /> : <ChevronDown size={16} className="mx-auto" />}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.tenLop}</td>
                      <td className="py-3 px-4 text-right">{item.siSo}</td>
                      <td className="py-3 px-4 text-right">{item.totalScores}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{item.avg}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-medium">{item.tot}</td>
                      <td className="py-3 px-4 text-right text-blue-600 font-medium">{item.kha}</td>
                      <td className="py-3 px-4 text-right text-amber-600 font-medium">{item.dat}</td>
                      <td className="py-3 px-4 text-right text-rose-600 font-medium">{item.chuaDat}</td>
                    </tr>
                    
                    {/* 4. Panel Chi tiết lớp (Expandable Row) */}
                    {expandedRow === item.classId && (
                      <tr className="bg-[#F1F5F9] border-b border-slate-200">
                        <td colSpan={9} className="p-0">
                          <div className="px-14 py-5 duration-200">
                            <h4 className="text-sm font-bold text-slate-800 mb-4">Phân tích chất lượng lớp {item.tenLop}</h4>
                            <div className="flex flex-wrap gap-6">
                              <div className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Điểm trung bình</div>
                                <div className="text-3xl font-bold text-slate-900">{item.avg}</div>
                                <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
                                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(Number(item.avg) / 10) * 100}%` }}></div>
                                </div>
                              </div>
                              
                              <div className="flex-[2] min-w-[300px] bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-center">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Tỷ lệ phân loại học lực (%)</div>
                                <div className="flex items-center w-full h-5 rounded-full overflow-hidden shadow-inner">
                                  {chartData.find(c => c.name === item.tenLop)?.Tot > 0 && <div className="h-full bg-emerald-500" style={{ width: `${chartData.find(c => c.name === item.tenLop)?.Tot}%` }} title="Tốt"></div>}
                                  {chartData.find(c => c.name === item.tenLop)?.Kha > 0 && <div className="h-full bg-blue-500" style={{ width: `${chartData.find(c => c.name === item.tenLop)?.Kha}%` }} title="Khá"></div>}
                                  {chartData.find(c => c.name === item.tenLop)?.Dat > 0 && <div className="h-full bg-amber-500" style={{ width: `${chartData.find(c => c.name === item.tenLop)?.Dat}%` }} title="Đạt"></div>}
                                  {chartData.find(c => c.name === item.tenLop)?.ChuaDat > 0 && <div className="h-full bg-rose-500" style={{ width: `${chartData.find(c => c.name === item.tenLop)?.ChuaDat}%` }} title="Chưa đạt"></div>}
                                </div>
                                <div className="flex gap-4 mt-4 text-xs font-medium text-slate-600 justify-between sm:justify-start">
                                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Tốt: {chartData.find(c => c.name === item.tenLop)?.Tot}%</div>
                                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Khá: {chartData.find(c => c.name === item.tenLop)?.Kha}%</div>
                                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Đạt: {chartData.find(c => c.name === item.tenLop)?.Dat}%</div>
                                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Chưa đạt: {chartData.find(c => c.name === item.tenLop)?.ChuaDat}%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



    </div>
  );
}
