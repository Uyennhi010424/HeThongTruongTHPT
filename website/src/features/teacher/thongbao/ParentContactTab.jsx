import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { getChuNhiemByGiaoVien } from "../../../api/chunhiemApi.js";
import { searchHocSinh } from "../../../api/hocsinhApi.js";
import { getParentsForStudent } from "../../../api/phuhuynhHocSinhApi.js";
import { createThongBao, getConversationByHocSinh } from "../../../api/thongbaoApi.js";
import { getLopById } from "../../../api/lopApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";
import { webSocketService } from "../../../utils/websocket.js";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

function StudentChatDrawer({ student, onClose, onRefresh, teacher }) {
  const [replyText, setReplyText] = useState("");
  const [title, setTitle] = useState("Trao đổi phụ huynh");
  const [sending, setSending] = useState(false);
  const isNam = teacher?.gioiTinh === true || teacher?.gioiTinh === "true" || teacher?.gioiTinh === "NAM" || teacher?.gioiTinh === "Nam" || teacher?.gioiTinh === "nam";
  const danhXung = isNam ? "Thầy" : "Cô";
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);
  const [conversation, setConversation] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchConversation = useCallback(async () => {
    if (!student?.id) return;
    try {
      const res = await getConversationByHocSinh(student.id);
      setConversation(res?.data?.data || []);
    } catch {
      setConversation([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [student?.id]);

  useEffect(() => {
    setLoadingHistory(true);
    fetchConversation();

    if (student?.id) {
      webSocketService.connect(() => {
        webSocketService.subscribe(`/topic/chat/${student.id}`, (newMsg) => {
          setConversation(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        });
      });
      return () => {
        webSocketService.unsubscribe(`/topic/chat/${student.id}`);
      };
    }
  }, [fetchConversation, student?.id]);

  // Scroll to bottom when conversation loads or updates
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "42px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 128)}px`;
    }
  }, [replyText]);

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await createThongBao({
        tieuDe: `[SLL] ${title}`,
        noiDung: replyText.trim(),
        doiTuong: "PHU_HUYNH",
        hocSinh: { id: student.id },
        senderRole: "GIAO_VIEN"
      });
      notifySuccess("Đã gửi tin nhắn cho phụ huynh!");
      setReplyText("");
      setTitle("Trao đổi phụ huynh");
      // Refresh conversation immediately
      await fetchConversation();
      onRefresh?.();
    } catch {
      notifyError("Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (tmplTitle, tmplContent) => {
    setTitle(tmplTitle);
    setReplyText(tmplContent);
  };

  const parents = student.phuHuynh || [];
  const parentNames = parents.filter(Boolean).map(p => p?.hoTen).filter(Boolean).join(", ") || "Chưa có TT Phụ huynh";
  const parentPhones = parents.filter(Boolean).map(p => p?.soDienThoai).filter(Boolean).join(", ") || "Chưa có SĐT";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-gray-50 h-full flex flex-col shadow-2xl animate-fade-in-right">
        {/* Header */}
        <div className="p-5 bg-white border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              {student.hoTen.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{student.hoTen}</h3>
              <p className="text-[11px] text-gray-500">{parentNames} - {parentPhones}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Templates */}
        <div className="p-3 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto custom-scrollbar">
          <button onClick={() => applyTemplate("Khen thưởng", `Chào phụ huynh,\n${danhXung} xin thông báo em ${student.hoTen} hôm nay có biểu hiện rất tốt trong giờ học...`)} className="shrink-0 px-3 py-1.5 bg-green-50 text-green-700 text-[11px] font-bold rounded-full border border-green-200 hover:bg-green-100">🎉 Khen thưởng</button>
          <button onClick={() => applyTemplate("Nhắc nhở học tập", `Chào phụ huynh,\n${danhXung} xin thông báo em ${student.hoTen} dạo này lơ là bài tập về nhà...`)} className="shrink-0 px-3 py-1.5 bg-orange-50 text-orange-700 text-[11px] font-bold rounded-full border border-orange-200 hover:bg-orange-100">⚠️ Nhắc nhở</button>
          <button onClick={() => applyTemplate("Báo nghỉ học", `Chào phụ huynh,\nHôm nay em ${student.hoTen} vắng mặt không phép...`)} className="shrink-0 px-3 py-1.5 bg-red-50 text-red-700 text-[11px] font-bold rounded-full border border-red-200 hover:bg-red-100">🚨 Báo vắng</button>
          <button onClick={() => applyTemplate("Kết quả học tập", `Chào phụ huynh,\nĐây là kết quả điểm kiểm tra gần nhất của em ${student.hoTen}...`)} className="shrink-0 px-3 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-200 hover:bg-blue-100">📈 Báo điểm</button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {loadingHistory ? (
            <div className="text-center text-gray-400 mt-10 text-xs">Đang tải lịch sử...</div>
          ) : conversation.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 text-xs">Chưa có lịch sử trao đổi.</div>
          ) : (
            conversation.map(msg => {
              const isTeacher = msg.senderRole === "GIAO_VIEN" || msg.nguoiTao?.role === "GIAO_VIEN";
              return (
                <div key={msg.id} className={`flex flex-col max-w-[85%] ${isTeacher ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                  <div className="text-[10px] text-gray-400 mb-1">{isTeacher ? 'Giáo viên' : 'Phụ huynh'} • {formatDateTime(msg.ngayDang)}</div>
                  <div className={`p-3 rounded-2xl text-sm ${isTeacher ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
                    {msg.isReply && msg.tieuDe && (
                      <div className="font-semibold text-[11px] opacity-80 mb-1 line-clamp-1">{msg.tieuDe}</div>
                    )}
                    {!msg.isReply && (
                      <div className="font-semibold text-[11px] opacity-80 mb-1">{msg.tieuDe}</div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.noiDung}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100 space-y-2">
          <input 
            type="text" 
            placeholder="Tiêu đề..." 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
          />
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (replyText.trim() && !sending) {
                    handleSend();
                  }
                }
              }}
              placeholder="Nhập nội dung tin nhắn..."
              className="flex-1 resize-none h-[42px] max-h-32 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 custom-scrollbar"
            />
            <button 
              onClick={handleSend}
              disabled={!replyText.trim() || sending}
              className="h-[42px] w-[42px] rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">{sending ? 'hourglass_empty' : 'send'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ParentContactTab({ teacher, parentMessages, onRefresh }) {
  const [lopChuNhiem, setLopChuNhiem] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const fileInputRef = useRef(null);

  const getHocSinhId = (m) => {
    if (m?.hocSinh?.id !== undefined) return Number(m.hocSinh.id);
    if (m?.hocSinhId !== undefined) return Number(m.hocSinhId);
    if (typeof m?.hocSinh === 'number' || typeof m?.hocSinh === 'string') return Number(m.hocSinh);
    return null;
  };

  useEffect(() => {
    if (!teacher?.id) return;
    let active = true;

    const fetchClassData = async () => {
      try {
        setLoading(true);
        // Lấy lớp chủ nhiệm
        const cnRes = await getChuNhiemByGiaoVien(teacher.id);
        const cnData = cnRes?.data?.data;
        if (!cnData || !cnData.lopId) {
          if (active) setLoading(false);
          return;
        }
        
        const lopRes = await getLopById(cnData.lopId);
        const lop = lopRes?.data?.data;
        if (active) setLopChuNhiem(lop);

        if (lop) {
          // Lấy danh sách học sinh
          const hsRes = await searchHocSinh({ lopId: lop.id });
          const hsList = hsRes?.data?.data || [];
          
          // Lấy phụ huynh cho từng học sinh
          const promises = hsList.map(async (st) => {
            try {
              const pRes = await getParentsForStudent(st.id);
              return { ...st, phuHuynh: pRes?.data?.data || [] };
            } catch {
              return { ...st, phuHuynh: [] };
            }
          });
          const studentsWithParents = await Promise.all(promises);
          if (active) setStudents(studentsWithParents);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchClassData();
    return () => { active = false; };
  }, [teacher?.id]);

  if (loading) {
    return <div className="text-center p-12 text-gray-400">Đang tải sổ liên lạc...</div>;
  }

  if (!lopChuNhiem) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">gpp_bad</span>
        <h3 className="text-lg font-bold text-gray-800">Không có quyền truy cập</h3>
        <p className="text-gray-500 mt-2">Chức năng "Sổ liên lạc điện tử" chỉ dành cho giáo viên chủ nhiệm.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px] h-[calc(100vh-280px)]">
      {/* Header & Search */}
      <div className="p-5 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
        <div>
          <h3 className="font-bold text-lg text-gray-900">Lớp chủ nhiệm: {lopChuNhiem.tenLop}</h3>
          <p className="text-xs text-gray-500">Quản lý sổ liên lạc điện tử ({students.length} học sinh)</p>
        </div>
      </div>

      {/* Student List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {students.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">Không tìm thấy kết quả.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {students.map(st => {
              const parents = st.phuHuynh || [];
              const parentName = parents.length > 0 ? parents.filter(Boolean).map(p => p?.hoTen).filter(Boolean).join(", ") : "Chưa cập nhật";
              const parentPhone = parents.length > 0 ? parents.filter(Boolean).map(p => p?.soDienThoai).filter(Boolean).join(", ") : "";
              
              // Đếm số tin nhắn trao đổi
              const msgs = parentMessages.filter(m => {
                if (getHocSinhId(m) === Number(st.id)) return true;
                if ((m.senderRole === "PHU_HUYNH" || m.nguoiTao?.role === "PHU_HUYNH") && m.nguoiTao?.id) {
                   const parentIds = (st.phuHuynh || []).map(p => p.id || p.userId || p.user?.id);
                   if (parentIds.includes(m.nguoiTao.id)) return true;
                }
                return false;
              });
              const lastMsg = msgs.sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang))[0];

              return (
                <div 
                  key={st.id} 
                  onClick={() => setSelectedStudent(st)}
                  className="bg-white border border-gray-100 hover:border-blue-300 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all group flex gap-4 items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                    {st.hoTen.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{st.hoTen}</h4>
                    <p className="text-[11px] text-gray-500 truncate mb-1">MSHS: {st.maHocSinh}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <span className="material-symbols-outlined text-[14px]">family_restroom</span>
                      <span className="truncate font-medium">{parentName}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                    </button>
                    {msgs.length > 0 && <span className="text-[10px] text-gray-400">{msgs.length} tin</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedStudent && (
        <StudentChatDrawer 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)}
          onRefresh={onRefresh}
          teacher={teacher}
        />
      )}
    </div>
  );
}
