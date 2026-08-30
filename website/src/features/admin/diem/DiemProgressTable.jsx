import { useState, useMemo, useEffect } from "react";
import { FileText, RefreshCw, Calculator, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getNamHoc } from "../../../api/namhocApi.js";
import { tinhHocLucLop } from "../../../api/hocbaApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

export default function DiemProgressTable({ progressData = [], loading, onRefresh, namHoc: namHocProp, setNamHoc, hocKy, setHocKy, searchQuery }) {
  const [availableNamHoc, setAvailableNamHoc] = useState([]);
  const [namHocListFull, setNamHocListFull] = useState([]);
  
  // Modal states
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryMode, setSummaryMode] = useState("ALL"); // "ALL" | "SINGLE"
  const [selectedLopId, setSelectedLopId] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  
  // field backend là tenNamHoc, fallback namHocProp hoặc năm đầu tiên từ dropdown
  const namHoc = namHocProp || availableNamHoc[0] || "";

  useEffect(() => {
    getNamHoc()
      .then(res => {
        const years = res?.data?.data || [];
        setNamHocListFull(years);
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

  const getSelectedNamHocId = () => {
    const selected = namHocListFull.find(nh => nh.tenNamHoc === namHoc);
    return selected ? selected.id : null;
  };

  const handleConfirmSummary = async () => {
    const nhId = getSelectedNamHocId();
    if (!nhId) {
      notifyError("Vui lòng chọn năm học hợp lệ");
      return;
    }

    if (summaryMode === "SINGLE" && !selectedLopId) {
      notifyError("Vui lòng chọn 1 lớp");
      return;
    }

    if (filteredData.length === 0) {
      notifyError("Không có danh sách lớp để tổng kết");
      return;
    }

    setIsCalculating(true);
    let successCount = 0;
    let failCount = 0;

    if (summaryMode === "ALL") {
      for (const item of filteredData) {
        try {
          await tinhHocLucLop({ lopId: item.lopId, namHocId: nhId });
          successCount++;
        } catch (err) {
          failCount++;
        }
      }
      if (failCount === 0) {
        notifySuccess(`Đã tổng kết thành công cho ${successCount} lớp!`);
      } else {
        notifyError(`Tổng kết xong. Thành công: ${successCount}, Thất bại: ${failCount}`);
      }
    } else {
      try {
        await tinhHocLucLop({ lopId: Number(selectedLopId), namHocId: nhId });
        const cls = filteredData.find(c => c.lopId === Number(selectedLopId));
        notifySuccess(`Tổng kết điểm lớp ${cls?.tenLop || ""} thành công!`);
      } catch (err) {
        console.error(err);
        notifyError(`Lỗi khi tổng kết điểm lớp này`);
      }
    }

    setIsCalculating(false);
    setIsSummaryModalOpen(false);
  };
  
  return (
    <>
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
        <button
          onClick={() => {
            setSummaryMode("ALL");
            if (filteredData.length > 0) setSelectedLopId(filteredData[0].lopId.toString());
            setIsSummaryModalOpen(true);
          }}
          disabled={filteredData.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Calculator className="w-4 h-4" />
          Tổng kết năm học
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
                    {item?.hasScores || (item?.totalEnteredScores && item?.totalEnteredScores > 0) ? (
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

      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                Tổng kết điểm cuối năm
              </h3>
              <button
                onClick={() => !isCalculating && setIsSummaryModalOpen(false)}
                disabled={isCalculating}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                Quá trình này sẽ tính toán ĐTB cả năm và xếp loại học lực cho học sinh. Bạn muốn thực hiện tổng kết cho:
              </p>
              
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="summaryMode"
                      checked={summaryMode === "ALL"}
                      onChange={() => setSummaryMode("ALL")}
                      disabled={isCalculating}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-slate-800 group-hover:text-blue-700">Toàn trường (Tất cả lớp)</span>
                    <span className="block text-xs text-slate-500 mt-1">Tổng kết cho tất cả các lớp trong năm học hiện tại. Quá trình có thể mất vài phút.</span>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="summaryMode"
                      checked={summaryMode === "SINGLE"}
                      onChange={() => setSummaryMode("SINGLE")}
                      disabled={isCalculating}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600"
                    />
                  </div>
                  <div className="w-full">
                    <span className="block text-sm font-semibold text-slate-800 group-hover:text-blue-700">Chọn 1 lớp cụ thể</span>
                    <span className="block text-xs text-slate-500 mt-1 mb-2">Chỉ tính toán và chốt sổ điểm cho một lớp mà bạn chọn dưới đây.</span>
                    
                    {summaryMode === "SINGLE" && (
                      <select
                        value={selectedLopId}
                        onChange={(e) => setSelectedLopId(e.target.value)}
                        disabled={isCalculating}
                        className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        {filteredData.map(cls => (
                          <option key={cls.lopId} value={cls.lopId}>{cls.tenLop}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>
              </div>
            </div>
            
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                disabled={isCalculating}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmSummary}
                disabled={isCalculating || (summaryMode === "SINGLE" && !selectedLopId)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCalculating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                ) : (
                  "Xác nhận"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
