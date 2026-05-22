import { useEffect, useState } from "react";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getHocKy } from "../../../api/hockyApi.js";

export default function NamHocHocKyPage() {
  const [years, setYears] = useState([]);
  const [hocKyList, setHocKyList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    hk1Start: "",
    hk1End: "",
    hk1Deadline: "",
    hk2Start: "",
    hk2End: "",
    hk2Deadline: ""
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [yRes, hkRes] = await Promise.all([getNamHoc(), getHocKy()]);
        if (!active) return;
        const yData = yRes?.data?.data || [];
        setYears(yData);
        setHocKyList(hkRes?.data?.data || []);
        if (yData.length) setSelectedYear(yData[0]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Đã lưu cấu hình (demo UI — kết nối API học kỳ sẽ bổ sung sau).");
    }, 800);
  };

  const yearLabel = selectedYear?.tenNamHoc || "—";

  return (
    <div className="space-y-lg">
      <PageHeader
        title="Cấu hình Năm học & Học kỳ"
        description="Quản lý các mốc thời gian và hạn chót nhập điểm cho toàn hệ thống."
        actions={
          <button
            type="button"
            className="flex items-center gap-sm rounded-xl bg-primary px-lg py-sm font-label-md text-on-primary shadow-md transition-all hover:brightness-110"
          >
            <MaterialIcon name="add_circle" />
            Thêm năm học mới
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <section className="card-elevation rounded-2xl bg-surface-container-lowest p-lg lg:col-span-1">
          <div className="mb-md flex items-center justify-between border-b border-outline-variant pb-sm">
            <h3 className="text-headline-md font-semibold text-primary">Danh sách Năm học</h3>
            <span className="rounded-full bg-secondary-fixed px-3 py-1 text-label-sm font-label-sm text-on-secondary-fixed">
              {years.length} Năm học
            </span>
          </div>
          <div className="space-y-sm">
            {loading ? (
              <p className="text-body-sm text-outline">Đang tải...</p>
            ) : (
              years.map((y, i) => {
                const active = selectedYear?.id === y.id;
                return (
                  <button
                    key={y.id}
                    type="button"
                    onClick={() => setSelectedYear(y)}
                    className={`flex w-full items-center justify-between rounded-xl border p-md text-left transition-colors ${
                      active
                        ? "border-2 border-secondary bg-secondary-container/10"
                        : "border-outline-variant bg-surface-container-low hover:bg-surface-container"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-headline-md font-semibold ${
                          active ? "text-on-secondary-container" : "text-on-surface-variant"
                        }`}
                      >
                        {y.tenNamHoc}
                      </p>
                      {i === 0 && (
                        <p className="flex items-center gap-xs text-label-sm text-secondary">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                          Đang diễn ra
                        </p>
                      )}
                    </div>
                    {active && (
                      <MaterialIcon name="check_circle" className="text-secondary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
          <div className="relative mt-lg overflow-hidden rounded-2xl bg-primary-container p-lg text-on-primary-container">
            <h4 className="text-label-md opacity-80">Trạng thái hệ thống</h4>
            <p className="text-headline-lg font-bold">Học kỳ I</p>
            <p className="mt-md text-body-sm">
              {hocKyList.length
                ? `${hocKyList.length} học kỳ đã cấu hình`
                : "Chưa có học kỳ trong CSDL"}
            </p>
            <MaterialIcon
              name="auto_awesome"
              className="absolute -bottom-4 -right-4 text-[120px] opacity-10"
            />
          </div>
        </section>

        <section className="card-elevation h-full rounded-2xl bg-surface-container-lowest p-lg lg:col-span-2">
          <div className="mb-xl flex items-center justify-between border-b border-outline-variant pb-sm">
            <div className="flex items-center gap-sm">
              <MaterialIcon name="settings" filled className="text-secondary" />
              <h3 className="text-headline-md font-semibold text-primary">
                Cấu hình Chi tiết: {yearLabel}
              </h3>
            </div>
            <button type="button" className="font-label-md text-secondary hover:underline">
              Khôi phục mặc định
            </button>
          </div>

          <form className="space-y-xl" onSubmit={handleSave}>
            {[
              { n: 1, prefix: "hk1", title: "Học kỳ I" },
              { n: 2, prefix: "hk2", title: "Học kỳ II", dim: true }
            ].map((hk) => (
              <div
                key={hk.prefix}
                className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-lg"
              >
                <div className="mb-lg flex items-center gap-sm">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-on-secondary ${
                      hk.dim ? "bg-secondary/50" : "bg-secondary"
                    }`}
                  >
                    {hk.n}
                  </span>
                  <h4 className="text-headline-md font-semibold text-on-surface">{hk.title}</h4>
                </div>
                <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                  <DateField
                    label="Ngày bắt đầu"
                    value={form[`${hk.prefix}Start`]}
                    onChange={(v) => setForm((f) => ({ ...f, [`${hk.prefix}Start`]: v }))}
                  />
                  <DateField
                    label="Ngày kết thúc"
                    value={form[`${hk.prefix}End`]}
                    onChange={(v) => setForm((f) => ({ ...f, [`${hk.prefix}End`]: v }))}
                  />
                  <div className="space-y-sm md:col-span-2">
                    <label className="font-label-md text-on-surface-variant">
                      Hạn chót nhập điểm (Giáo viên)
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-sm font-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      value={form[`${hk.prefix}Deadline`]}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          [`${hk.prefix}Deadline`]: e.target.value
                        }))
                      }
                    />
                    {hk.n === 1 && (
                      <p className="flex items-center gap-xs font-label-sm text-error">
                        <MaterialIcon name="info" className="text-[16px]" />
                        Sau thời gian này, hệ thống sẽ tự động khóa chức năng nhập điểm.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-md pt-md">
              <button
                type="button"
                className="rounded-xl border border-secondary px-xl py-sm font-label-md text-secondary transition-all hover:bg-secondary/5"
              >
                Hủy thay đổi
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-primary px-xl py-sm font-label-md text-on-primary shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
              >
                {saving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="flex flex-col items-center gap-lg rounded-2xl border border-secondary/20 bg-gradient-to-r from-secondary/10 to-transparent p-lg md:flex-row">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-on-secondary shadow-lg">
          <MaterialIcon name="psychology" filled className="text-[32px]" />
        </div>
        <div>
          <h5 className="text-headline-md font-semibold text-primary">Gợi ý từ EduAI</h5>
          <p className="mt-1 max-w-3xl text-body-md text-on-surface-variant">
            Dựa trên dữ liệu năm học trước, chúng tôi nhận thấy các kỳ thi học kỳ thường diễn ra
            sớm hơn 1 tuần so với lịch dự kiến hiện tại. Bạn có muốn điều chỉnh lịch thi để tối
            ưu hóa thời gian chấm điểm cho giáo viên?
          </p>
        </div>
        <button
          type="button"
          className="ml-auto flex items-center gap-xs rounded-full border border-outline-variant bg-surface-container-lowest px-lg py-sm font-label-md text-on-surface transition-all hover:bg-surface-container"
        >
          Xem chi tiết <MaterialIcon name="arrow_forward" className="text-[18px]" />
        </button>
      </section>
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <div className="space-y-sm">
      <label className="font-label-md text-on-surface-variant">{label}</label>
      <div className="relative">
        <input
          type="date"
          className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-sm font-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <MaterialIcon
          name="calendar_month"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline"
        />
      </div>
    </div>
  );
}
