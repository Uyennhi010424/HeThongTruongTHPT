import { useState, useEffect } from "react";
import Header from "../../components/common/Header.jsx";
import axiosClient from "../../api/axiosClient.js";
import { useConfirm } from "../../contexts/ConfirmContext.jsx";
import { notifySuccess, notifyError } from "../../utils/notify.js";


export default function TeacherDuyetNghi() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lopChuNhiem, setLopChuNhiem] = useState(null);
  
  // Duyệt/Từ chối state
  const [processingId, setProcessingId] = useState(null);
  const { confirm } = useConfirm();
  const [feedbackNotes, setFeedbackNotes] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // 1. Lấy thông tin giáo viên hiện tại (đã bao gồm lopChuNhiemId nếu là GVCN)
      const gvRes = await axiosClient.get("/giaovien/me");
      const gv = gvRes.data?.data;
      if (!gv) throw new Error("Không lấy được thông tin");
      
      if (!gv.isGvcn || !gv.lopChuNhiemId) {
        setError("Bạn không chủ nhiệm lớp nào.");
        return;
      }
      
      setLopChuNhiem({ id: gv.lopChuNhiemId, tenLop: gv.tenLopChuNhiem });

      // 2. Lấy danh sách đơn xin nghỉ của lớp
      const reqsRes = await axiosClient.get(`/don-xin-nghi/lop/${gv.lopChuNhiemId}`);
      setRequests(reqsRes.data?.data || []);
      
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách đơn xin nghỉ.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id, status) => {
    if (!(await confirm(`Bạn có chắc chắn muốn ${status === "APPROVED" ? "DUYỆT" : "TỪ CHỐI"} đơn này?`))) return;
    try {
      setProcessingId(id);
      await axiosClient.put(`/don-xin-nghi/${id}/duyet`, {
        trangThai: status,
        phanHoi: feedbackNotes[id] || ""
      });
      notifySuccess(`Đã ${status === "APPROVED" ? "duyệt" : "từ chối"} đơn xin nghỉ!`);
      // Cập nhật state nội bộ để thấy kết quả ngay lập tức
      setRequests((prev) => 
        prev.map((req) => (req.id === id ? { ...req, trangThai: status } : req))
      );
    } catch (err) {
      notifyError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      case "APPROVED":
        return <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Đã duyệt</span>;
      case "REJECTED":
        return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Từ chối</span>;
      default:
        return status;
    }
  };

  return (
    <div className="flex-1 bg-surface min-h-screen">
      <Header title="Duyệt đơn xin nghỉ" />
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {loading && <div className="text-center p-8 text-gray-500">Đang tải dữ liệu...</div>}
        
        {!loading && error && (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 shadow-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && lopChuNhiem && (
          <div className="bg-white rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-on-surface">
                Đơn xin nghỉ - Lớp {lopChuNhiem.tenLop}
              </h2>
            </div>

            {requests.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-gray-400 gap-3">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                  <i className="fi fi-rr-document text-2xl"></i>
                </div>
                <p>Chưa có đơn xin nghỉ nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-4 pl-6 font-semibold text-sm text-slate-700 w-48 whitespace-nowrap">Học sinh</th>
                      <th className="p-4 font-semibold text-sm text-slate-700 w-48 whitespace-nowrap">Thời gian nghỉ</th>
                      <th className="p-4 font-semibold text-sm text-slate-700 max-w-xs">Lý do</th>
                      <th className="p-4 font-semibold text-sm text-slate-700 w-32 text-center whitespace-nowrap">Trạng thái</th>
                      <th className="p-4 font-semibold text-sm text-slate-700 w-64 min-w-[200px]">Phản hồi của GV</th>
                      <th className="p-4 pr-6 font-semibold text-sm text-slate-700 w-48 text-center whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                              {req.tenHocSinh.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{req.tenHocSinh}</div>
                              {req.tenPhuHuynh && (
                                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                  <i className="fi fi-rr-user text-[10px]"></i> PH: {req.tenPhuHuynh}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                          <div className="font-semibold text-slate-700 mb-1">
                            {req.ngayBatDau.split('-').reverse().join('/')}
                          </div>
                          {req.ngayBatDau !== req.ngayKetThuc && (
                            <div className="flex items-center gap-2 text-slate-500">
                              <i className="fi fi-rr-arrow-right text-gray-400"></i>
                              {req.ngayKetThuc.split('-').reverse().join('/')}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-sm text-slate-600 max-w-xs" title={req.lyDo}>
                          <div className="line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100">{req.lyDo}</div>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          {getStatusBadge(req.trangThai)}
                        </td>
                        <td className="p-4">
                          {req.trangThai === "PENDING" ? (
                            <input 
                              type="text"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none shadow-sm"
                              placeholder="Nhập ghi chú (nếu có)..."
                              value={feedbackNotes[req.id] || ""}
                              onChange={e => setFeedbackNotes({...feedbackNotes, [req.id]: e.target.value})}
                            />
                          ) : (
                            <div className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-h-[42px] flex items-center gap-2">
                              {req.phanHoiGv ? (
                                <>
                                  <i className="fi fi-rr-comment-alt text-slate-400 shrink-0"></i>
                                  <span className="line-clamp-2">{req.phanHoiGv}</span>
                                </>
                              ) : (
                                <span className="text-slate-400 italic">Không có ghi chú</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4 pr-6">
                          {req.trangThai === "PENDING" ? (
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={() => handleProcess(req.id, "APPROVED")}
                                disabled={processingId === req.id}
                                className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                              >
                                <i className="fi fi-rr-check"></i> Duyệt
                              </button>
                              <button 
                                onClick={() => handleProcess(req.id, "REJECTED")}
                                disabled={processingId === req.id}
                                className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 text-sm font-bold rounded-xl hover:bg-rose-100 hover:border-rose-200 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                              >
                                <i className="fi fi-rr-cross"></i> Từ chối
                              </button>
                            </div>
                          ) : (
                            <div className="text-center text-slate-400 text-sm font-medium italic bg-slate-50 py-2 rounded-xl border border-slate-100">
                              <i className="fi fi-rr-check-circle mr-1 text-emerald-500"></i> Đã xử lý
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
