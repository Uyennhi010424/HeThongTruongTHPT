import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";

const SCHEDULE = [
  { mon: "Toán học", gv: "Thầy Hùng", color: "bg-blue-50 border-blue-100 text-on-primary-fixed-variant" },
  { mon: "Ngữ văn", gv: "Cô Lan", color: "bg-emerald-50 border-emerald-100 text-emerald-800" },
  { mon: "Vật lý", gv: "Thầy Nam", color: "bg-amber-50 border-amber-100 text-amber-800" }
];

export default function AdminThoiKhoaBieuPage() {
  return (
    <div className="space-y-lg">
      <PageHeader title="Thời khóa biểu" description="Xem và cập nhật TKB theo lớp và học kỳ." />

      <section className="flex flex-wrap items-end gap-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-card">
        <Filter label="Chọn Lớp học" options={["Lớp 12A1", "Lớp 10A1"]} />
        <Filter label="Chọn Học kỳ" options={["Học kỳ I - 2023-2024"]} />
        <div className="ml-auto flex gap-sm">
          <button
            type="button"
            className="flex items-center gap-sm rounded-lg border border-outline px-lg py-2 font-label-md text-primary hover:bg-primary-fixed-dim"
          >
            <MaterialIcon name="print" />
            In TKB
          </button>
          <button
            type="button"
            className="flex items-center gap-sm rounded-lg bg-primary px-lg py-2 font-label-md text-on-primary shadow-md hover:brightness-110"
          >
            <MaterialIcon name="edit_calendar" />
            Cập nhật
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
        <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-outline-variant bg-surface-container-high">
          <div className="p-md text-center font-label-md text-outline">Tiết</div>
          {["THỨ 2", "THỨ 3", "THỨ 4", "THỨ 5", "THỨ 6", "THỨ 7"].map((d) => (
            <div key={d} className="border-l border-outline-variant/30 p-md text-center font-label-md text-primary">
              {d}
            </div>
          ))}
        </div>
        {[1, 2, 3].map((tiet) => (
          <div key={tiet} className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-outline-variant/30 hover:bg-surface-container">
            <div className="flex flex-col items-center justify-center border-r border-outline-variant/30 p-md">
              <span className="font-bold text-primary">{tiet}</span>
              <span className="text-[10px] text-outline">07:00</span>
            </div>
            {[0, 1, 2, 3, 4, 5].map((col) => {
              const lesson = col < 3 ? SCHEDULE[col] : null;
              return (
                <div key={col} className="border-r border-outline-variant/30 p-sm last:border-r-0">
                  {lesson ? (
                    <div className={`h-full rounded-lg border p-2 transition-all hover:-translate-y-0.5 ${lesson.color}`}>
                      <p className="font-label-md">{lesson.mon}</p>
                      <p className="text-[12px] opacity-70">{lesson.gv}</p>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[72px] items-center justify-center italic text-outline/40">
                      Trống
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </section>
    </div>
  );
}

function Filter({ label, options }) {
  return (
    <div className="min-w-[200px] space-y-sm">
      <label className="text-label-sm text-on-surface-variant">{label}</label>
      <select className="w-full rounded-lg border-outline-variant bg-surface-container-lowest p-3 focus:border-secondary focus:ring-secondary/20">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
