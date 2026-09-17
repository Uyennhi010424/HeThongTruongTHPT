import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";
import axiosClient from "../../api/axiosClient.js";
import { useConfirm } from "../../contexts/ConfirmContext.jsx";
import { notifySuccess, notifyError } from "../../utils/notify.js";


export default function ParentXinNghi() {
  const { students, currentStudent, selectedIndex, selectStudent, loading: studentsLoading } = useParentStudents();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { confirm } = useConfirm();
  const [error, setError] = useState("");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState("single"); // 'single' | 'multiple'
  const [formData, setFormData] = useState({
    ngayBatDau: "",
    ngayKetThuc: "",
    lyDo: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    if (!currentStudent?.id) return;
    fetchRequests();
  }, [currentStudent?.id]);

  const fetchRequests = async () => {
    if (!currentStudent?.id) return;
    try {
      setLoading(true);
      setError("");
      const res = await axiosClient.get("/don-xin-nghi/me");
      if (res.data?.data) {
        const filtered = res.data.data.filter(r => r.hocSinhId === currentStudent.id);
        setRequests(filtered);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách đơn xin nghỉ.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!currentStudent?.id) {
      notifyError("Không tìm thấy thông tin học sinh. Vui lòng chọn học sinh.");
      return;
    }

    const ngayBatDau = formData.ngayBatDau;
    const ngayKetThuc = leaveType === "single" ? ngayBatDau : formData.ngayKetThuc;

    if (!ngayBatDau || !ngayKetThuc || !formData.lyDo?.trim()) {
      notifyError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (ngayBatDau < todayStr) {
      notifyError("Không thể xin nghỉ cho các ngày trong quá khứ");
      return;
    }

    if (leaveType === "multiple" && ngayBatDau > ngayKetThuc) {
      notifyError("Ngày kết thúc không thể trước ngày bắt đầu");
      return;
    }

    try {
      setSubmitting(true);
      await axiosClient.post("/don-xin-nghi", {
        ngayBatDau,
        ngayKetThuc,
        lyDo: formData.lyDo.trim(),
        hocSinhId: currentStudent.id
      });
      notifySuccess("Tạo đơn xin nghỉ thành công!");
      setShowForm(false);
      setLeaveType("single");
      setFormData({ ngayBatDau: "", ngayKetThuc: "", lyDo: "" });
      fetchRequests();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || "Lỗi khi tạo đơn");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm("Bạn có chắc chắn muốn hủy đơn này?"))) return;
    try {
      await axiosClient.delete(`/don-xin-nghi/${id}`);
      notifySuccess("Hủy đơn thành công!");
      fetchRequests();
    } catch (err) {
      notifyError(err.response?.data?.message || "Không thể hủy đơn");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
      case "CHO_DUYET":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Chờ duyệt</span>;
      case "APPROVED":
      case "DA_DUYET":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Đã duyệt</span>;
      case "REJECTED":
      case "TU_CHOI":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Từ chối</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status || "--"}</span>;
    }
  };

  return (
    <div className="flex-1 bg-surface min-h-screen">
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4 border-b border-slate-200 shrink-0">
        <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-3">
          Xin nghỉ phép
        </h2>
        <p className="text-slate-500 text-[14px] mt-2">
          Theo dõi lịch sử nghỉ phép và tạo đơn xin nghỉ cho học sinh
        </p>
      </div>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pt-2">
        
        {/* Chọn học sinh */}
        {students && students.length > 0 && (
          <div className="mb-6">
            <StudentSelector 
              students={students}
              selectedIndex={selectedIndex}
              onSelect={selectStudent}
            />
          </div>
        )}

        <div className="border-b border-gray-200 pb-4 mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-on-surface">Lịch sử xin nghỉ</h2>
          {!showForm && (
            <button 
              onClick={() => {
                setLeaveType("single");
                setFormData({ ngayBatDau: "", ngayKetThuc: "", lyDo: "" });
                setShowForm(true);
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl font-semibold shadow-sm hover:bg-primary-dark transition-all"
            >
              + Tạo đơn mới
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant">
            <h3 className="text-lg font-bold mb-4">Tạo đơn xin nghỉ cho {currentStudent?.hoTen}</h3>
            
            {/* Toggle 1 Ngày / Nhiều ngày */}
            <div className="flex bg-slate-100 p-1 rounded-xl max-w-xs mb-4">
              <button
                type="button"
                onClick={() => {
                  setLeaveType("single");
                  if (formData.ngayBatDau) {
                    setFormData(prev => ({ ...prev, ngayKetThuc: prev.ngayBatDau }));
                  }
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  leaveType === "single"
                    ? "bg-white text-blue-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                1 Ngày
              </button>
              <button
                type="button"
                onClick={() => setLeaveType("multiple")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  leaveType === "multiple"
                    ? "bg-white text-blue-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Nhiều ngày
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 max-w-lg">
              {leaveType === "single" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày nghỉ</label>
                  <input 
                    type="date" 
                    min={todayStr}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    value={formData.ngayBatDau}
                    onChange={e => setFormData({ ...formData, ngayBatDau: e.target.value, ngayKetThuc: e.target.value })}
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                    <input 
                      type="date" 
                      min={todayStr}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                      value={formData.ngayBatDau}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          ngayBatDau: val,
                          ngayKetThuc: prev.ngayKetThuc && prev.ngayKetThuc < val ? val : prev.ngayKetThuc
                        }));
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                    <input 
                      type="date" 
                      min={formData.ngayBatDau || todayStr}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                      value={formData.ngayKetThuc}
                      onChange={e => setFormData({ ...formData, ngayKetThuc: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              {(() => {
                const isSun = (dStr) => dStr ? new Date(dStr + "T00:00:00").getDay() === 0 : false;
                if (isSun(formData.ngayBatDau) || (leaveType === "multiple" && isSun(formData.ngayKetThuc))) {
                  return (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                      <span className="text-sm">⚠️</span>
                      <span>Lưu ý: Ngày đã chọn là Chủ nhật (ngày nghỉ của trường).</span>
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do nghỉ</label>
                <textarea 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  placeholder="Nhập lý do xin nghỉ..."
                  value={formData.lyDo}
                  onChange={e => setFormData({ ...formData, lyDo: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-4">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-primary text-white py-2 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-50 transition-all"
                >
                  {submitting ? "Đang gửi..." : "Gửi đơn"}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Danh sách đơn */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500 gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500 bg-red-50/50">
              <i className="fi fi-rr-exclamation text-3xl mb-2 block"></i>
              <p>{error}</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-gray-400 gap-3">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                <i className="fi fi-rr-document text-2xl"></i>
              </div>
              <p>Chưa có đơn xin nghỉ nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 pl-6 font-semibold text-sm text-slate-700 whitespace-nowrap">Thời gian nghỉ</th>
                    <th className="p-4 font-semibold text-sm text-slate-700">Lý do</th>
                    <th className="p-4 font-semibold text-sm text-slate-700 whitespace-nowrap">Trạng thái</th>
                    <th className="p-4 font-semibold text-sm text-slate-700 min-w-[200px]">Phản hồi từ GVCN</th>
                    <th className="p-4 pr-6 font-semibold text-sm text-slate-700 whitespace-nowrap text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 pl-6 text-sm font-medium text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">
                            {req.ngayBatDau.split('-').reverse().join('/')} 
                            {req.ngayBatDau !== req.ngayKetThuc && ` - ${req.ngayKetThuc.split('-').reverse().join('/')}`}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 max-w-[250px] truncate" title={req.lyDo}>
                        {req.lyDo}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {getStatusBadge(req.trangThai)}
                      </td>
                      <td className="p-4 text-sm">
                        {req.phanHoiGv ? (
                          <div className="flex items-start gap-2 text-slate-700">
                            <i className="fi fi-rr-comment-alt text-slate-400 mt-0.5 shrink-0"></i>
                            <span className="line-clamp-2" title={req.phanHoiGv}>{req.phanHoiGv}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa có phản hồi</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right whitespace-nowrap">
                        {req.trangThai === "PENDING" ? (
                          <button 
                            onClick={() => handleDelete(req.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition-colors inline-flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <i className="fi fi-rr-trash"></i> Hủy đơn
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xl">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
