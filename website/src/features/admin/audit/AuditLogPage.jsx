import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";

const ROWS = [
  {
    time: "14:35:21",
    date: "25/10/2023",
    user: "Trần Hoàng Nam",
    role: "Giáo viên Toán",
    hs: "Lê Minh Tuấn",
    mon: "Toán Học (GK1)",
    old: "4.5",
    neu: "7.5",
    lyDo: "Nhập nhầm điểm của học sinh khác..."
  },
  {
    time: "10:12:05",
    date: "25/10/2023",
    user: "Hệ thống Admin",
    role: "Administrator",
    hs: "Phạm Thúy Hằng",
    mon: "Vật Lý (15')",
    old: "—",
    neu: "9.0",
    lyDo: "Phê duyệt phúc khảo bài thi"
  }
];

export default function AuditLogPage() {
  return (
    <div className="space-y-lg">
      <PageHeader
        title="Nhật ký Hệ thống"
        description="Theo dõi lịch sử thay đổi dữ liệu, đặc biệt là điểm số và hồ sơ học sinh."
        actions={
          <>
            <button
              type="button"
              className="flex items-center gap-xs rounded-xl bg-surface-container-highest px-lg py-sm font-label-md text-on-surface transition-all hover:bg-surface-variant"
            >
              <MaterialIcon name="download" />
              Xuất báo cáo (CSV)
            </button>
            <button
              type="button"
              className="flex items-center gap-xs rounded-xl bg-primary px-lg py-sm font-label-md text-on-primary shadow-md transition-all active:scale-[0.98]"
            >
              <MaterialIcon name="refresh" />
              Làm mới dữ liệu
            </button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-lg">
        <FilterBox className="lg:col-span-4" />
        <FilterBox className="lg:col-span-3" small />
        <FilterBox className="lg:col-span-3" small />
        <div className="col-span-12 flex items-end pb-lg lg:col-span-2">
          <button
            type="button"
            className="w-full rounded-xl bg-secondary-container py-sm font-bold text-on-secondary-container hover:opacity-90"
          >
            Lọc dữ liệu
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-high font-label-md text-on-surface">
                <th className="px-lg py-md">Thời gian</th>
                <th className="px-lg py-md">Người thực hiện</th>
                <th className="px-lg py-md">Đối tượng (HS)</th>
                <th className="px-lg py-md">Nội dung</th>
                <th className="px-lg py-md text-center">Cũ</th>
                <th className="px-lg py-md text-center">Mới</th>
                <th className="px-lg py-md">Lý do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {ROWS.map((r, i) => (
                <tr key={i} className="transition-colors hover:bg-surface-container-low">
                  <td className="px-lg py-md font-body-sm">
                    <div className="font-bold">{r.time}</div>
                    <div className="text-on-surface-variant">{r.date}</div>
                  </td>
                  <td className="px-lg py-md">
                    <p className="font-label-md">{r.user}</p>
                    <p className="text-[10px] uppercase text-on-surface-variant">{r.role}</p>
                  </td>
                  <td className="px-lg py-md font-label-md">{r.hs}</td>
                  <td className="px-lg py-md">
                    <span className="rounded bg-secondary-container/10 px-sm py-xs text-[12px] font-bold text-on-secondary-container">
                      {r.mon}
                    </span>
                  </td>
                  <td className="px-lg py-md text-center font-bold text-error">{r.old}</td>
                  <td className="px-lg py-md text-center font-bold text-primary">{r.neu}</td>
                  <td className="px-lg py-md text-body-sm italic text-on-surface-variant">{r.lyDo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-lg py-md">
          <p className="text-body-sm text-on-surface-variant">Hiển thị 1-10 trong số 1,240 bản ghi</p>
          <div className="flex gap-xs">
            <button type="button" className="h-10 w-10 rounded-lg bg-primary font-bold text-on-primary">
              1
            </button>
            <button type="button" className="h-10 w-10 rounded-lg hover:bg-surface-variant">
              2
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterBox({ className = "", small }) {
  return (
    <div
      className={`rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-lg shadow-card ${className}`}
    >
      {!small && <label className="mb-sm block font-label-md text-on-surface">Thời gian</label>}
      {small ? (
        <select className="w-full rounded-lg border-outline-variant bg-surface-container-low p-3 focus:border-secondary">
          <option>Tất cả giáo viên & Admin</option>
        </select>
      ) : (
        <div className="flex gap-sm">
          <input type="date" className="flex-1 rounded-lg border-outline-variant bg-surface-container-low p-3" />
          <input type="date" className="flex-1 rounded-lg border-outline-variant bg-surface-container-low p-3" />
        </div>
      )}
    </div>
  );
}
