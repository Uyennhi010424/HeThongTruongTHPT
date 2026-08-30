import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, Send, CheckCircle2, AlertCircle, Loader2, CalendarDays } from "lucide-react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getDiemProgressSummary, guiBangDiemTuDong } from "../../../api/diemApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import DiemProgressTable from "./DiemProgressTable.jsx";


export default function AdminNhapDiemPage() {
  const currentSemester = 1;
  const [namHoc, setNamHoc] = useState("2025-2026"); // Default to 2025-2026 since we have sample data there
  const [hocKy, setHocKy] = useState(currentSemester);
  const [sendHocKy, setSendHocKy] = useState(currentSemester);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);
  const { searchQuery, setIsSearchVisible, setSearchPlaceholder } = useAdminSearch();

  // State cho chức năng gửi bảng điểm tự động
  const [sending, setSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState("");
  const [sendError, setSendError] = useState("");


  useEffect(() => {
    setIsSearchVisible(true);
    setSearchPlaceholder("Tìm kiếm bảng điểm...");

    return () => {
      setIsSearchVisible(false);
      setSearchPlaceholder("Tìm kiếm...");
    };
  }, [setIsSearchVisible, setSearchPlaceholder]);

  useEffect(() => {
    getNamHoc()
      .then(res => {
        const years = res?.data?.data || [];
        if (years.length > 0) {
          const active = years.find((nh) => nh.trangThai === "DANG_MO");
          if (active && active.tenNamHoc) {
            setNamHoc(active.tenNamHoc);
          } else {
            const unique = [...new Set(years.map(y => y.tenNamHoc || y.namHoc).filter(Boolean))].sort().reverse();
            if (unique.length > 0) setNamHoc(unique[0]);
          }
        }
        setServerError(false);
      })
      .catch((err) => {
        const isConnRefused = !err.response; // no response = server down
        if (isConnRefused) {
          console.error("[AdminNhapDiemPage] Không thể kết nối Backend:", err.message);
          setServerError(true);
          setLoading(false);
        }
      });
  }, []);

  const fetchProgress = async () => {
    if (!namHoc || namHoc.length !== 9) return;
    setLoading(true);
    setServerError(false);
    try {
      const res = await getDiemProgressSummary({ namHoc, hocKy });
      setProgressData(res?.data?.data || []);
    } catch (err) {
      if (!err.response) {
        console.error("[AdminNhapDiemPage] Lỗi kết nối khi lấy tiến độ:", err.message);
        setServerError(true);
      } else {
        console.error("[AdminNhapDiemPage] Lỗi API:", err.response?.status, err.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [namHoc, hocKy]);

  const handleGuiBangDiem = async () => {
    try {
      setSending(true);
      setSendError("");
      setSendSuccessMsg("");
      const res = await guiBangDiemTuDong(sendHocKy);
      setSendSuccessMsg(res?.data?.message || "Hệ thống đang tiến hành gửi điểm...");
    } catch (err) {
      setSendError(err?.response?.data?.message || "Lỗi kết nối máy chủ");
    } finally {
      setSending(false);
    }
  };

  if (serverError) {
    return (
      <div className="space-y-lg">
        <PageHeader
          title="Quản lý điểm"
          description="Theo dõi tiến độ nhập điểm của giáo viên theo từng lớp và môn học."
        />
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <WifiOff className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-base font-semibold text-slate-700 mb-2">Không thể kết nối máy chủ</h3>
          <p className="text-sm text-slate-500 mb-6">Backend chưa sẵn sàng hoặc đang khởi động lại. Vui lòng thử lại sau.</p>
          <button
            onClick={fetchProgress}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        title="Quản lý điểm"
        description="Theo dõi tiến độ nhập điểm của giáo viên theo từng lớp và môn học."
      />

      {/* Panel gửi bảng điểm tự động */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-2">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Send size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-[15px]">Gửi bảng điểm cho phụ huynh</h3>
              <p className="text-slate-500 text-[13px] mt-0.5">Gửi tất cả điểm đã khóa sổ (LOCKED) chưa thông báo trong kỳ này vào hộp chat phụ huynh.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-slate-400" />
              <label className="text-[13px] text-slate-600 font-medium">Chọn kỳ gửi:</label>
              <select
                value={sendHocKy}
                onChange={e => { setSendHocKy(Number(e.target.value)); setSendSuccessMsg(""); setSendError(""); }}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
              >
                <option value={1}>Học kỳ 1</option>
                <option value={2}>Học kỳ 2</option>
              </select>
            </div>
            <button
              onClick={handleGuiBangDiem}
              disabled={sending}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
            >
              {sending
                ? <>Loading... <Loader2 size={14} className="animate-spin" /></>
                : <><Send size={14} /> Gửi ngay</>
              }
            </button>
          </div>
        </div>

        {/* Kết quả gửi */}
        {sendSuccessMsg && (
          <div className="mt-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-800 text-[14px]">Thành công</p>
              <p className="text-[13px] text-green-700 mt-1">{sendSuccessMsg}</p>
            </div>
          </div>
        )}
        {sendError && (
          <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700 text-[14px]">Gửi thất bại</p>
              <p className="text-[13px] text-red-600 mt-1">{sendError}</p>
            </div>
          </div>
        )}
      </div>

      <DiemProgressTable 
        progressData={progressData}
        loading={loading}
        onRefresh={fetchProgress}
        namHoc={namHoc}
        setNamHoc={setNamHoc}
        hocKy={hocKy}
        setHocKy={setHocKy}
        searchQuery={searchQuery}
      />
    </div>
  );
}
