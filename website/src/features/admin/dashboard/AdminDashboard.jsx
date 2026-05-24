import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getLop } from "../../../api/lopApi.js";

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0));
const normalizeGrade = (value) => String(value ?? "").trim();

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    grade10: 0,
    grade11: 0,
    grade12: 0,
    avgScore: 7.8
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [hs, gv, lop] = await Promise.all([
          getHocSinh(),
          getGiaoVien(),
          getLop()
        ]);
        if (!active) return;
        const classesArr = lop?.data?.data || [];
        setStats({
          students: (hs?.data?.data || []).length,
          teachers: (gv?.data?.data || []).length,
          classes: classesArr.length,
          grade10: classesArr.filter((item) => normalizeGrade(item.khoi) === "10").length,
          grade11: classesArr.filter((item) => normalizeGrade(item.khoi) === "11").length,
          grade12: classesArr.filter((item) => normalizeGrade(item.khoi) === "12").length,
          avgScore: 7.8
        });
      } catch {
        if (active) setError("Không thể tải thống kê.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const gradeDistribution = useMemo(
    () => [
      { label: "GIỎI", pct: 36, h: "85%" },
      { label: "KHÁ", pct: 42, h: "60%" },
      { label: "TB", pct: 15, h: "40%" },
      { label: "YẾU", pct: 7, h: "15%" }
    ],
    []
  );

  const blockAvg = useMemo(
    () => [
      { name: "Khối 10", value: 7.5, h: "75%" },
      { name: "Khối 11", value: 7.9, h: "79%" },
      { name: "Khối 12", value: 8.2, h: "82%" }
    ],
    []
  );

  return (
    <div className="space-y-lg">
      <PageHeader
        title="Tổng quan quản lý"
        description="Chào mừng trở lại! Dưới đây là dữ liệu cập nhật của trường THPT."
        actions={
          <>
            <button
              type="button"
              className="flex items-center gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest px-lg py-md font-label-md shadow-sm transition-all hover:-translate-y-0.5"
            >
              <MaterialIcon name="download" />
              Xuất báo cáo
            </button>
            <Link
              to="/admin/hocsinh"
              className="flex items-center gap-sm rounded-xl bg-primary px-lg py-md font-label-md text-on-primary shadow-md transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <MaterialIcon name="add" />
              Thêm mới
            </Link>
          </>
        }
      />

      {error && (
        <p className="rounded-xl bg-error-container px-md py-sm text-body-sm text-on-error-container">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-lg md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Tổng lớp",
            value: stats.classes,
            icon: "groups",
            border: "border-primary",
            iconColor: "text-primary-container"
          },
          {
            label: "Khối 10",
            value: stats.grade10,
            icon: "groups",
            border: "border-secondary",
            iconColor: "text-secondary"
          },
          {
            label: "Khối 11",
            value: stats.grade11,
            icon: "groups",
            border: "border-tertiary",
            iconColor: "text-tertiary"
          },
          {
            label: "Khối 12",
            value: stats.grade12,
            icon: "groups",
            border: "border-error",
            iconColor: "text-error"
          }
        ].map((card) => (
          <div
            key={card.label}
            className={`flex items-center justify-between rounded-2xl border-l-4 bg-surface-container-lowest p-lg shadow-card ${card.border}`}
          >
            <div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {card.label}
              </p>
              <p className="text-headline-md font-bold text-primary">
                {loading
                  ? "..."
                  : card.format
                    ? card.format(card.value)
                    : formatNumber(card.value)}
              </p>
            </div>
            <MaterialIcon
              name={card.icon}
              className={`text-4xl opacity-40 ${card.iconColor}`}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-12">
        <section className="card-elevation rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-lg lg:col-span-8">
          <div className="mb-xl flex items-center justify-between border-b border-outline-variant/30 pb-sm">
            <h3 className="text-headline-md font-semibold text-primary">
              ĐTB theo khối
            </h3>
            <select className="rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-secondary focus:ring-secondary">
              <option>Năm học 2023-2024</option>
            </select>
          </div>
          <div className="flex h-64 items-end justify-around gap-lg px-lg">
            {blockAvg.map((b) => (
              <div key={b.name} className="group relative flex max-w-[80px] flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t-lg bg-secondary-container/80 transition-all group-hover:bg-secondary-container"
                  style={{ height: b.h }}
                />
                <span className="mt-md font-label-md text-outline">{b.name}</span>
                <span className="absolute -top-8 hidden rounded bg-on-background px-2 py-1 text-[10px] text-white group-hover:block">
                  {b.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card-elevation rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-lg lg:col-span-4">
          <h3 className="mb-xl text-headline-md font-semibold text-primary">
            Tỷ lệ xếp loại
          </h3>
          <div className="relative mx-auto mb-lg h-48 w-48">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(#1e3a8a 0% 30%, #39b8fd 30% 66%, #3d4143 66% 81%, #ba1a1a 81% 100%)"
              }}
            />
            <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-surface-container-lowest">
              <span className="text-headline-md font-bold text-primary">85%</span>
              <span className="text-[10px] font-bold uppercase text-outline">
                Khá/Giỏi
              </span>
            </div>
          </div>
          <div className="flex justify-around text-[10px] font-bold text-on-surface-variant">
            {gradeDistribution.map((g) => (
              <span key={g.label}>{g.label}</span>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-2">
        <RecentClasses />
        <AtRiskStudents />
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-primary-container p-lg text-on-primary-container">
        <div className="relative z-10 max-w-xl">
          <h4 className="text-headline-md font-semibold">Tính năng AI Dự đoán kết quả</h4>
          <p className="mt-sm font-body-sm text-on-primary-container/80">
            Hệ thống AI phân tích dữ liệu học tập để dự báo xu hướng điểm số cuối kỳ.
          </p>
          <Link
            to="/admin/config"
            className="mt-md inline-flex rounded-lg bg-white px-lg py-sm font-label-md font-semibold text-primary shadow-md transition-all hover:brightness-105"
          >
            Cấu hình AI
          </Link>
        </div>
        <MaterialIcon
          name="psychology"
          className="absolute -bottom-4 -right-4 rotate-12 text-[120px] opacity-10"
          filled
        />
      </section>
    </div>
  );
}

function RecentClasses() {
  const rows = [
    { lop: "12A1", siSo: 42, gvcn: "Nguyễn Văn A", status: "Hoạt động" },
    { lop: "11B3", siSo: 38, gvcn: "Trần Thị B", status: "Hoạt động" },
    { lop: "10C2", siSo: 45, gvcn: "Lê Văn C", status: "Thiếu GV" }
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-card">
      <div className="flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-low/50 px-lg py-md">
        <h3 className="text-headline-md font-semibold text-primary">Lớp học gần đây</h3>
        <Link to="/admin/lop" className="font-label-md text-secondary hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/80 text-label-md text-on-surface">
              <th className="px-lg py-md">Lớp</th>
              <th className="px-lg py-md">Sĩ số</th>
              <th className="px-lg py-md">GVCN</th>
              <th className="px-lg py-md">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {rows.map((r) => (
              <tr key={r.lop} className="transition-colors hover:bg-surface-container-low">
                <td className="px-lg py-md font-bold text-primary">{r.lop}</td>
                <td className="px-lg py-md">{r.siSo}</td>
                <td className="px-lg py-md">{r.gvcn}</td>
                <td className="px-lg py-md">
                  <span
                    className={`rounded-full px-sm py-xs text-[12px] font-bold ${
                      r.status === "Hoạt động"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AtRiskStudents() {
  const students = [
    { name: "Phạm Hoàng Nam", lop: "12A5", score: 4.2 },
    { name: "Đặng Minh Tuyết", lop: "11B2", score: 4.5 },
    { name: "Vũ Thành Đạt", lop: "10A1", score: 4.8 }
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-card">
      <div className="flex items-center justify-between border-b border-outline-variant/30 px-lg py-md">
        <h3 className="flex items-center gap-sm text-headline-md font-semibold text-error">
          <MaterialIcon name="warning" />
          Cần hỗ trợ
        </h3>
        <Link to="/admin/report" className="font-label-md text-outline hover:underline">
          Báo cáo chi tiết
        </Link>
      </div>
      <div className="space-y-md p-lg">
        {students.map((s) => (
          <div
            key={s.name}
            className="flex items-center justify-between rounded-xl border border-error-container/30 bg-error-container/10 p-md"
          >
            <div>
              <p className="font-label-md text-on-surface">{s.name}</p>
              <p className="text-body-sm text-on-surface-variant">Lớp {s.lop}</p>
            </div>
            <div className="text-right">
              <p className="text-headline-md font-bold text-error">{s.score}</p>
              <p className="text-[10px] font-bold uppercase text-error">Trung bình</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
