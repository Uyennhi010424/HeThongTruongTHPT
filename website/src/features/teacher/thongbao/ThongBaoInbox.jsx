import { useEffect, useState, useMemo } from "react";
import { getThread, replyThongBao, createThongBao } from "../../../api/thongbaoApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";
import BaoCongThongBaoUI from "../../../components/common/BaoCongThongBaoUI.jsx";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

const getSenderLabel = (role) => {
  switch (role) {
    case "ADMIN": return "Quản trị";
    case "GIAO_VIEN": return "Giáo viên";
    case "HOC_SINH": return "Học sinh";
    case "PHU_HUYNH": return "Phụ huynh";
    default: return role || "Hệ thống";
  }
};

export default function ThongBaoInbox({ notices, onRefresh, teacher }) {
  const [selectedNotice, setSelectedNotice] = useState(null);
  
  // Detail states
  const [thread, setThread] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  // Compose Modal states
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ category: "Báo cáo", title: "", content: "" });
  const [composing, setComposing] = useState(false);

  const displayNotices = useMemo(() => {
    let result = notices || [];
    return result.sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang));
  }, [notices]);

  useEffect(() => {
    if (!selectedNotice) return;
    let active = true;
    setLoadingThread(true);
    getThread(selectedNotice.id)
      .then(res => {
        if (active) setThread(res?.data?.data || []);
      })
      .catch(() => {
        if (active) setThread([selectedNotice]);
      })
      .finally(() => {
        if (active) setLoadingThread(false);
      });
    return () => { active = false; };
  }, [selectedNotice]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await replyThongBao(selectedNotice.id, {
        tieuDe: `Re: ${selectedNotice.tieuDe}`,
        noiDung: replyText.trim(),
        loai: "REPLY"
      });
      notifySuccess("Đã gửi phản hồi!");
      setReplyText("");
      // Reload thread
      const res = await getThread(selectedNotice.id);
      setThread(res?.data?.data || []);
      onRefresh?.();
    } catch {
      notifyError("Không thể gửi phản hồi.");
    } finally {
      setSending(false);
    }
  };

  const handleCompose = async (e) => {
    e.preventDefault();
    if (!composeForm.title.trim() || !composeForm.content.trim()) {
      notifyError("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }
    setComposing(true);
    try {
      await createThongBao({
        tieuDe: `[${composeForm.category}] ${composeForm.title.trim()}`,
        noiDung: composeForm.content.trim(),
        loai: "ADMIN",
        doiTuong: "ADMIN",
        senderRole: "GIAO_VIEN"
      });
      notifySuccess("Đã gửi tin nhắn cho BGH!");
      setComposeForm({ category: "Báo cáo", title: "", content: "" });
      setShowCompose(false);
      onRefresh?.();
    } catch {
      notifyError("Không thể gửi tin nhắn.");
    } finally {
      setComposing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end pr-4">
        <button 
          onClick={() => setShowCompose(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">edit_square</span>
          Soạn tin nhắn cho BGH
        </button>
      </div>

      <BaoCongThongBaoUI 
        notices={displayNotices}
        onNoticeClick={(notice) => setSelectedNotice(notice)}
      />

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowCompose(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">edit_square</span>
                Soạn tin nhắn mới
              </h3>
              <button onClick={() => setShowCompose(false)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCompose} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Loại tin nhắn</label>
                <select
                  value={composeForm.category}
                  onChange={e => setComposeForm({...composeForm, category: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option>Báo cáo</option>
                  <option>Xin nghỉ phép</option>
                  <option>Hỗ trợ kỹ thuật</option>
                  <option>Đề xuất</option>
                  <option>Khác</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Tiêu đề</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nhập tiêu đề ngắn gọn..." 
                  value={composeForm.title}
                  onChange={e => setComposeForm({...composeForm, title: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Nội dung</label>
                <textarea
                  required
                  placeholder="Trình bày nội dung chi tiết..."
                  rows={5}
                  value={composeForm.content}
                  onChange={e => setComposeForm({...composeForm, content: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCompose(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={composing || !composeForm.title.trim() || !composeForm.content.trim()}
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {composing && <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span>}
                  Gửi tin nhắn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thread/Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setSelectedNotice(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedNotice.tieuDe}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    Ban Giám Hiệu
                  </span>
                  <span>•</span>
                  <span>{formatDateTime(selectedNotice.ngayDang)}</span>
                </div>
              </div>
              <button onClick={() => setSelectedNotice(null)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Thread */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/50">
              {loadingThread ? (
                <div className="flex justify-center mt-10">
                  <span className="material-symbols-outlined animate-spin text-gray-400">autorenew</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {thread.map((msg) => {
                    const isMe = msg.nguoiTao?.id === teacher?.userId;
                    
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-500">{isMe ? 'Bạn' : getSenderLabel(msg.nguoiTao?.role)}</span>
                          <span className="text-[10px] text-gray-400">{formatDateTime(msg.ngayDang)}</span>
                        </div>
                        <div className={`p-4 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.noiDung}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reply Input */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              <div className="flex gap-3">
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Viết phản hồi..."
                  className="flex-1 resize-none h-12 max-h-32 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-colors custom-scrollbar"
                />
                <button 
                  onClick={handleReply}
                  disabled={!replyText.trim() || sending}
                  className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
                >
                  <span className="material-symbols-outlined">{sending ? 'hourglass_empty' : 'send'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
