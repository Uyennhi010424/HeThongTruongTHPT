import { useState, useMemo, useEffect } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { getNamHoc } from "../../../api/namhocApi.js";

export default function DiemProgressTable({ progressData = [], loading, onRefresh, namHoc: namHocProp, setNamHoc, hocKy, setHocKy, searchQuery }) {
  const [availableNamHoc, setAvailableNamHoc] = useState([]);
  // field backend là tenNamHoc, fallback namHocProp hoặc năm đầu tiên từ dropdown
  const namHoc = namHocProp || availableNamHoc[0] || "";

  useEffect(() => {
    getNamHoc()
      .then(res => {
        const years = res?.data?.data || [];
        const unique = [...new Set(years.map(y => y.tenNamHoc || y.namHoc).filter(Boolean))].sort().reverse();
        setAvailableNamHoc(unique);
        
        if (!namHocProp && setNamHoc) {
          const active = years.find((nh) => nh.trangThai === "DANG_MO");
          if (active && active.tenNamHoc) {
            setNamHoc(active.tenNamHoc);
          } else if (unique.length > 0) {
            setNamHoc(unique[0]);
          }
        }
      })
      .catch(() => {});
  }, []);
  const filteredData = useMemo(() => {
    const dataArray = Array.isArray(progressData) ? progressData : [];
    if (dataArray.length === 0) return [];
    
    const query = (searchQuery || "").toLowerCase();
    return dataArray.filter((item) => {
      if (!item) return false;
      const matchSearch = (item.tenLop || "").toLowerCase().includes(query) || 
                          (item.tenGvcn || "").toLowerCase().includes(query);
      return matchSearch;
    });
  }, [progressData, searchQuery]);



  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-end gap-3">
        <select
          value={namHoc}
          onChange={(e) => setNamHoc && setNamHoc(e.target.value)}
          className="pl-3 pr-8 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
        >
          {availableNamHoc.length === 0 && namHoc && (
            <option value={namHoc}>{namHoc}</option>
          )}
          {availableNamHoc.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={hocKy}
          onChange={(e) => setHocKy(Number(e.target.value))}
          className="pl-3 pr-8 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
        >
          <option value={1}>Học kỳ 1</option>
          <option value={2}>Học kỳ 2</option>
        </select>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lớp</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">GVCN</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Sĩ số</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                  <div className="flex justify-center items-center">
                    <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="ml-2">Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                  Không tìm thấy lớp học nào.
                </td>
              </tr>
            ) : (
              (Array.isArray(filteredData) ? filteredData : []).map((item) => (
                <tr key={item?.lopId || Math.random()} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{item?.tenLop}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{item?.tenGvcn}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{item?.siSo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {item?.hasScores ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        Đã nhập
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Chưa nhập
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/diem/lop/${item.lopId}?namHoc=${encodeURIComponent(namHoc)}&hocKy=${hocKy}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 border border-transparent rounded-lg text-white hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Xem điểm
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
