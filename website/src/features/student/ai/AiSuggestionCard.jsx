import { useState } from 'react';
import aiApi from '../../../api/aiApi';
import { notifySuccess, notifyError } from '../../../utils/notify';

export default function AiSuggestionCard({ hocSinhId, hocKy, namHoc }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchSuggestions = async () => {
    if (!hocSinhId) {
      notifyError('Thiếu thông tin học sinh');
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const res = await aiApi.goiYHocTap(hocSinhId, hocKy, namHoc);
      setData(res.data?.data || res.data);
      notifySuccess('Đã tạo gợi ý học tập');
    } catch (err) {
      notifyError(err.response?.data?.message || 'Không thể tạo gợi ý. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-6 shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
          <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Gợi ý học tập bằng AI</h3>
          <p className="text-sm text-gray-500">Phân tích và đề xuất cải thiện kết quả học tập</p>
        </div>
      </div>

      {/* Initial button */}
      {!data && !loading && (
        <button
          onClick={fetchSuggestions}
          className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 font-medium text-white shadow-md transition hover:from-purple-600 hover:to-blue-600 hover:shadow-lg active:scale-[0.98]"
        >
          Nhận gợi ý học tập
        </button>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <span className="text-sm text-gray-500">Đang phân tích kết quả học tập...</span>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="space-y-4">
          {/* Academic Level */}
          {data.mucDoHocLuc && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 flex items-center gap-3">
              <div>
                <div className="text-xs text-purple-600 font-medium">Mức độ học lực</div>
                <div className="text-lg font-bold text-purple-800">{data.mucDoHocLuc}</div>
              </div>
            </div>
          )}

          {/* Strengths - Green */}
          {data.diemManh && data.diemManh.length > 0 && (
            <Section
              title="Điểm mạnh"
              items={data.diemManh}
              color="green"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          )}

          {/* Weaknesses - Red */}
          {(data.canCaiThien || data.diemYeu) && (data.canCaiThien || data.diemYeu).length > 0 && (
            <Section
              title="Cần cải thiện"
              items={data.canCaiThien || data.diemYeu}
              color="red"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              }
            />
          )}

          {/* Subject suggestions - Blue */}
          {(data.goiYTheoMon || data.goiYMonHoc) && (data.goiYTheoMon || data.goiYMonHoc).length > 0 && (
            <Section
              title="Gợi ý theo môn"
              items={data.goiYTheoMon || data.goiYMonHoc}
              color="blue"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              }
            />
          )}

          {/* General suggestions - Purple */}
          {data.goiYChung && data.goiYChung.length > 0 && (
            <Section
              title="Gợi ý chung"
              items={data.goiYChung}
              color="purple"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              }
            />
          )}

          {/* Action items - Yellow */}
          {data.hanhDongCanLam && data.hanhDongCanLam.length > 0 && (
            <Section
              title="Hành động cần làm"
              items={data.hanhDongCanLam}
              color="yellow"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              }
            />
          )}

          {/* Refresh button */}
          <button
            onClick={fetchSuggestions}
            className="mt-2 w-full rounded-xl border border-purple-300 bg-white/60 px-5 py-2.5 font-medium text-purple-600 shadow-sm transition hover:bg-purple-50 hover:shadow-md active:scale-[0.98]"
          >
            Làm mới gợi ý
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Reusable section ---------- */

const colorMap = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    title: 'text-green-700',
    icon: 'text-green-500',
    badge: 'bg-green-100 text-green-700',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    title: 'text-red-700',
    icon: 'text-red-500',
    badge: 'bg-red-100 text-red-700',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'text-blue-700',
    icon: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    title: 'text-yellow-700',
    icon: 'text-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    title: 'text-purple-700',
    icon: 'text-purple-500',
    badge: 'bg-purple-100 text-purple-700',
  },
};

function Section({ title, items, color, icon }) {
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={c.icon}>{icon}</span>
        <h4 className={`text-sm font-semibold ${c.title}`}>{title}</h4>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
            <span className={`mt-0.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${c.badge}`} />
            <span>{typeof item === 'string' ? item : item.mon ? <><strong>{item.mon}:</strong> {item.goiY}</> : item.noiDung || item.goiY || JSON.stringify(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
