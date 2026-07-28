import { useState, useMemo } from "react";
import { createThongBao, getThread, replyThongBao } from "../../../api/thongbaoApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

function RequestThreadModal({ request, onClose }) {
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useState(() => {
    let active = true;
    getThread(request.id)
      .then(r => { if (active) setThread(r?.data?.data || []); })
      .catch(() => { if (active) setThread([request]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request.id]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await replyThongBao(request.id, {
        tieuDe: `Re: ${request.tieuDe}`,
        noiDung: replyText.trim(),
        loai: "REPLY"
      });
      notifySuccess("Đã gửi phản hồi!");
      setReplyText("");
      const r = await getThread(request.id);
      setThread(r?.data?.data || []);
    } catch {
      notifyError("Lỗi khi gửi phản hồi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-gray-900">{request.tieuDe}</h3>
            <p className="text-xs text-gray-500 mt-1">{formatDateTime(request.ngayDang)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="text-center text-gray-400 mt-10">Đang tải...</div>
          ) : (
            thread.map(msg => {
              const isAdmin = msg.nguoiTao?.role === "ADMIN";
              return (
                <div key={msg.id} className={`flex flex-col max-w-[85%] ${isAdmin ? 'mr-auto items-start' : 'ml-auto items-end'}`}>
                  <div className="text-[10px] text-gray-400 mb-1">{isAdmin ? 'Quản trị viên' : 'Bạn'} • {formatDateTime(msg.ngayDang)}</div>
                  <div className={`p-3.5 rounded-2xl text-sm ${isAdmin ? 'bg-gray-100 text-gray-800 rounded-tl-sm' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
                    <p className="whitespace-pre-wrap">{msg.noiDung}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl flex gap-3">
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Viết phản hồi cho Admin..."
            className="flex-1 resize-none h-11 max-h-32 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 custom-scrollbar"
          />
          <button 
            onClick={handleReply}
            disabled={!replyText.trim() || sending}
            className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">{sending ? 'hourglass_empty' : 'send'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRequestTab({ teacher, requests, onRefresh }) {
  const [form, setForm] = useState({ category: "Báo cáo", priority: "Bình thường", title: "", content: "" });
  const [sending, setSending] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      notifyError("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }
    setSending(true);
    try {
      const isUrgent = form.priority === "Khẩn cấp";
      await createThongBao({
        tieuDe: `[${form.category}] ${form.title.trim()}`,
        noiDung: form.content.trim(),
        loai: "ADMIN",
        senderRole: "GIAO_VIEN",
        mucDo: isUrgent ? "KHAN" : "BINH_THUONG"
      });
      notifySuccess("Đã gửi yêu cầu cho Admin!");
      setForm({ ...form, title: "", content: "" });
      onRefresh?.();
    } catch {
      notifyError("Không thể gửi yêu cầu.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* FORM CỘT TRÁI */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-blue-600">contact_support</span>
          <h3 className="font-bold text-lg text-gray-800">Tạo yêu cầu mới</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Danh mục</label>
              <select 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="Báo cáo">Báo cáo</option>
                <option value="Hỗ trợ">Hỗ trợ</option>
                <option value="Đề xuất">Đề xuất</option>
                <option value="Sự cố">Sự cố hệ thống</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Mức ưu tiên</label>
              <select 
                value={form.priority} 
                onChange={e => setForm({...form, priority: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="Bình thường">Bình thường</option>
                <option value="Cao">Cao</option>
                <option value="Khẩn cấp">Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">Tiêu đề</label>
            <input 
              type="text" 
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Nhập tiêu đề tóm tắt..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">Nội dung chi tiết</label>
            <textarea 
              value={form.content}
              onChange={e => setForm({...form, content: e.target.value})}
              placeholder="Mô tả chi tiết yêu cầu hoặc vấn đề của bạn..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm h-32 resize-none custom-scrollbar focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={sending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {sending ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </form>
      </div>

      {/* LỊCH SỬ CỘT PHẢI */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[600px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-500">history</span>
            <h3 className="font-bold text-lg text-gray-800">Lịch sử yêu cầu</h3>
          </div>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">{requests.length} yêu cầu</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          {requests.length === 0 ? (
            <div className="text-center text-gray-400 mt-20 text-sm">Chưa có yêu cầu nào được gửi.</div>
          ) : (
            requests.sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang)).map(req => {
              const isUrgent = req.mucDo === "KHAN";
              return (
                <div 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-gray-800">{req.tieuDe}</h4>
                    {isUrgent && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0">Khẩn</span>}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-3">{req.noiDung}</p>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">{formatDateTime(req.ngayDang)}</span>
                    <span className="text-blue-600 font-semibold flex items-center gap-1">
                      Xem chi tiết <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedRequest && (
        <RequestThreadModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}
    </div>
  );
}
