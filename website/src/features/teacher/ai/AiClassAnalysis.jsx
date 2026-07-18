import { useState } from 'react';
import aiApi from '../../../api/aiApi';
import { notifySuccess, notifyError } from '../../../utils/notify';

export default function AiClassAnalysis({ lopId, hocKy, namHoc }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchAnalysis = async () => {
    if (!lopId) {
      notifyError('Thiếu thông tin lớp học');
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const res = await aiApi.phanTichLop(lopId, hocKy, namHoc);
      setData(res.data?.data || res.data);
      notifySuccess('Đã phân tích lớp học');
    } catch (err) {
      notifyError(err.response?.data?.message || 'Không thể phân tích. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-cyan-50 p-6 shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
          <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Phân tích lớp học bằng AI</h3>
          <p className="text-sm text-gray-500">Tổng quan và gợi ý phương pháp giảng dạy</p>
        </div>
      </div>

      {/* Initial button */}
      {!data && !loading && (
        <button
          onClick={fetchAnalysis}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-3 font-medium text-white shadow-md transition hover:from-indigo-600 hover:to-cyan-600 hover:shadow-lg active:scale-[0.98]"
        >
          Phân tích lớp học
        </button>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <span className="text-sm text-gray-500">Đang phân tích lớp học...</span>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="space-y-4">
          {/* Overview */}
          {data.tongQuanLop && (
            <div className="rounded-xl border border-indigo-200 bg-white/70 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                <h4 className="text-sm font-semibold text-indigo-700">Tổng quan lớp</h4>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">
                {typeof data.tongQuanLop === 'string'
                  ? data.tongQuanLop
                  : data.tongQuanLop.moTa || JSON.stringify(data.tongQuanLop)}
              </p>
            </div>
          )}

          {/* At-risk students */}
          {data.hocSinhCanChuY && data.hocSinhCanChuY.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <h4 className="text-sm font-semibold text-red-700">Học sinh cần chú ý</h4>
              </div>
              <div className="space-y-2">
                {data.hocSinhCanChuY.map((hs, idx) => (
                  <div key={idx} className="rounded-lg border border-red-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        {hs.hoTen || hs.tenHocSinh || `Học sinh ${idx + 1}`}
                      </span>
                      {hs.diemTrungBinh != null && (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          DTB: {hs.diemTrungBinh}
                        </span>
                      )}
                    </div>
                    {hs.lyDo && (
                      <p className="mt-1 text-xs text-gray-500">{hs.lyDo}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teacher suggestions */}
          {(data.goiYChoGiaoVien || data.goiYGiaoVien) && (data.goiYChoGiaoVien || data.goiYGiaoVien).length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                <h4 className="text-sm font-semibold text-emerald-700">Gợi ý cho giáo viên</h4>
              </div>
              <ul className="space-y-1.5">
                {(data.goiYChoGiaoVien || data.goiYGiaoVien).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                    <span>{typeof item === 'string' ? item : item.noiDung || JSON.stringify(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Teaching methods */}
          {data.phuongPhapDay && data.phuongPhapDay.length > 0 && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-sky-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
                <h4 className="text-sm font-semibold text-sky-700">Phương pháp dạy gợi ý</h4>
              </div>
              <ul className="space-y-1.5">
                {data.phuongPhapDay.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
                    <span>{typeof item === 'string' ? item : item.noiDung || item.tenPhuongPhap || JSON.stringify(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={fetchAnalysis}
            className="mt-2 w-full rounded-xl border border-indigo-300 bg-white/60 px-5 py-2.5 font-medium text-indigo-600 shadow-sm transition hover:bg-indigo-50 hover:shadow-md active:scale-[0.98]"
          >
            Phân tích lại
          </button>
        </div>
      )}
    </div>
  );
}
