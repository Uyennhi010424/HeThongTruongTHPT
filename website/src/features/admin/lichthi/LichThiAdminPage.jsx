import { useEffect, useState } from "react";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getLichThi } from "../../../api/lichthiApi.js";

export default function LichThiAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLichThi()
      .then((res) => setItems(res?.data?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const displayRows =
    items.length > 0
      ? items
      : [
          { id: 1, monThi: "Toán học", ngayThi: "15/05/2024", caThi: "Ca 1", phong: "P.402" },
          { id: 2, monThi: "Ngữ văn", ngayThi: "16/05/2024", caThi: "Ca 1", phong: "P.405" }
        ];

  return (
    <div className="space-y-lg">
      <PageHeader
        title="Lịch thi Học kỳ II"
        description="Quản lý lịch thi theo năm học, học kỳ và khối lớp."
        actions={
          <>
            <button
              type="button"
              className="flex items-center gap-sm rounded-xl bg-surface-container-highest px-md py-sm font-label-md text-primary transition-all hover:bg-primary hover:text-on-primary"
            >
              <MaterialIcon name="download" />
              Xuất lịch thi
            </button>
            <button
              type="button"
              className="flex items-center gap-sm rounded-xl bg-primary px-lg py-sm font-label-md text-on-primary shadow-md transition-all hover:scale-[1.02]"
            >
              <MaterialIcon name="add" />
              Thêm lịch thi
            </button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        <section className="col-span-12 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-card lg:col-span-4">
          <h3 className="mb-md flex items-center gap-sm text-headline-md font-semibold text-primary">
            <MaterialIcon name="filter_alt" />
            Bộ lọc dữ liệu
          </h3>
          <div className="space-y-4">
            <FilterSelect label="Năm học" options={["2023 - 2024", "2022 - 2023"]} />
            <FilterSelect label="Học kỳ" options={["Học kỳ II", "Học kỳ I"]} />
            <div className="grid grid-cols-2 gap-md">
              <FilterSelect label="Khối" options={["Khối 10", "Khối 11", "Khối 12"]} />
              <FilterSelect label="Lớp" options={["10A1", "10A2"]} />
            </div>
            <button
              type="button"
              className="w-full rounded-lg bg-secondary-container py-3 font-label-md text-on-secondary-container hover:brightness-95"
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </section>

        <div className="col-span-12 grid grid-cols-1 gap-gutter md:grid-cols-3 lg:col-span-8">
          <StatCard icon="assignment_turned_in" label="Tổng số môn thi" value="12" variant="primary" />
          <StatCard icon="calendar_month" label="Ngày bắt đầu" value="15 / 05 / 2024" />
          <StatCard icon="priority_high" label="Phòng thi dự kiến" value="24 Phòng" iconColor="text-error" />
        </div>

        <section className="col-span-12 overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
          <div className="flex items-center justify-between border-b border-outline-variant px-lg py-md">
            <h3 className="text-headline-md font-semibold text-primary">Danh sách lịch thi chi tiết</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-high/50 font-label-md">
                  <th className="px-lg py-4">Môn thi</th>
                  <th className="px-lg py-4 text-center">Ngày thi</th>
                  <th className="px-lg py-4 text-center">Ca thi</th>
                  <th className="px-lg py-4 text-center">Phòng thi</th>
                  <th className="px-lg py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-lg py-8 text-center text-outline">
                      Đang tải...
                    </td>
                  </tr>
                ) : (
                  displayRows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-surface-container-low">
                      <td className="px-lg py-4 font-label-md">{row.monThi || row.tenMon}</td>
                      <td className="px-lg py-4 text-center text-body-sm">{row.ngayThi}</td>
                      <td className="px-lg py-4 text-center">
                        <span className="rounded-full bg-secondary/10 px-3 py-1 text-[12px] font-bold text-secondary">
                          {row.caThi || "Ca 1"}
                        </span>
                      </td>
                      <td className="px-lg py-4 text-center text-body-sm">{row.phong || "—"}</td>
                      <td className="px-lg py-4 text-right">
                        <button type="button" className="p-2 text-primary hover:bg-primary/10 rounded-lg">
                          <MaterialIcon name="edit" className="text-[20px]" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function FilterSelect({ label, options }) {
  return (
    <div>
      <label className="mb-2 block font-label-md text-on-surface-variant">{label}</label>
      <select className="w-full rounded-lg border-outline-variant bg-background p-3 text-body-md focus:border-secondary focus:ring-secondary/20">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function StatCard({ icon, label, value, variant, iconColor }) {
  const bg = variant === "primary" ? "bg-primary-container text-on-primary-container" : "bg-surface-container-high";
  return (
    <div className={`flex flex-col justify-between rounded-xl p-lg shadow-md ${bg}`}>
      <MaterialIcon name={icon} className={`mb-2 text-[32px] ${iconColor || (variant === "primary" ? "" : "text-secondary")}`} />
      <p className="font-label-md opacity-70">{label}</p>
      <p className="text-headline-md font-bold">{value}</p>
    </div>
  );
}
