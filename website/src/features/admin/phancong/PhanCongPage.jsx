import { useEffect, useState } from "react";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getLop } from "../../../api/lopApi.js";

const DEMO_ROWS = [
  { gv: "Nguyễn Văn A", ma: "GV001", mon: "Toán học", lop: "10A1", hk: "Học kỳ 1" },
  { gv: "Trần Thị B", ma: "GV023", mon: "Ngữ Văn", lop: "11B2", hk: "Học kỳ 1" },
  { gv: "Phạm Hoàng D", ma: "GV009", mon: "Vật Lý", lop: "12C1", hk: "Học kỳ 2" }
];

export default function PhanCongPage() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    Promise.all([getGiaoVien(), getMonHoc(), getLop()]).then(([gv, mh, lop]) => {
      setTeachers(gv?.data?.data || []);
      setSubjects(mh?.data?.data || []);
      setClasses(lop?.data?.data || []);
    });
  }, []);

  const confirmAssign = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <div className="space-y-lg">
      <PageHeader
        title="Phân công Giảng dạy"
        description="Quản lý và điều phối giáo viên đứng lớp trong năm học hiện tại."
      />

      <div className="grid grid-cols-12 gap-lg">
        <section className="col-span-12 flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-card lg:col-span-4">
          <div className="border-b border-outline-variant bg-surface-container-low p-lg">
            <h3 className="flex items-center gap-sm text-headline-md font-semibold text-primary">
              <MaterialIcon name="person_add" />
              Tạo phân công mới
            </h3>
          </div>
          <div className="flex flex-1 flex-col space-y-md p-lg">
            <SelectField label="Chọn Giáo viên" options={teachers.map((t) => t.hoTen)} />
            <div className="grid grid-cols-2 gap-md">
              <SelectField label="Môn học" options={subjects.map((m) => m.tenMon)} />
              <SelectField label="Lớp học" options={classes.map((l) => l.tenLop)} />
            </div>
            <div>
              <span className="mb-sm block font-label-md text-on-surface-variant">Học kỳ</span>
              <div className="flex gap-md">
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 border-secondary-fixed bg-secondary-fixed p-md font-label-md">
                  <input type="radio" name="hk" defaultChecked className="sr-only" />
                  Học kỳ 1
                </label>
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 border-outline-variant p-md font-label-md">
                  <input type="radio" name="hk" className="sr-only" />
                  Học kỳ 2
                </label>
              </div>
            </div>
            <button
              type="button"
              onClick={confirmAssign}
              className="mt-lg flex w-full items-center justify-center gap-md rounded-xl bg-secondary py-md font-label-md text-white shadow-md transition-all hover:brightness-110"
            >
              <MaterialIcon name="add_task" />
              Xác nhận phân công
            </button>
            <p className="text-center text-label-sm text-outline">
              API phân công backend sẽ được kết nối trong bản cập nhật tiếp theo.
            </p>
          </div>
        </section>

        <section className="col-span-12 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-card lg:col-span-8">
          <div className="flex items-center justify-between border-b border-outline-variant p-lg">
            <h3 className="text-headline-md font-semibold text-on-surface">
              Danh sách phân công hiện tại
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low">
                <tr className="text-label-md uppercase text-on-surface-variant">
                  <th className="px-lg py-md">Giáo viên</th>
                  <th className="px-lg py-md">Môn học</th>
                  <th className="px-lg py-md text-center">Lớp</th>
                  <th className="px-lg py-md text-center">Học kỳ</th>
                  <th className="px-lg py-md text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {DEMO_ROWS.map((r) => (
                  <tr key={`${r.ma}-${r.lop}`} className="group transition-colors hover:bg-secondary-fixed/10">
                    <td className="px-lg py-md">
                      <p className="font-label-md">{r.gv}</p>
                      <p className="text-label-sm text-on-surface-variant">{r.ma}</p>
                    </td>
                    <td className="px-lg py-md">
                      <span className="rounded-md bg-primary-fixed px-sm py-xs text-label-sm text-on-primary-fixed-variant">
                        {r.mon}
                      </span>
                    </td>
                    <td className="px-lg py-md text-center font-label-md">{r.lop}</td>
                    <td className="px-lg py-md text-center">
                      <span className="rounded-full bg-surface-container-highest px-sm py-xs text-label-sm">
                        {r.hk}
                      </span>
                    </td>
                    <td className="px-lg py-md text-right">
                      <button
                        type="button"
                        className="rounded-lg p-sm text-error opacity-0 transition-all group-hover:opacity-100 hover:bg-error-container"
                        title="Xóa"
                      >
                        <MaterialIcon name="delete" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div
        className={`fixed bottom-lg right-lg flex items-center gap-md rounded-xl bg-inverse-surface px-lg py-md text-inverse-on-surface shadow-xl transition-all ${
          toast ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        <MaterialIcon name="check_circle" className="text-secondary-container" />
        <span className="font-label-md">Đã cập nhật phân công giảng dạy thành công!</span>
      </div>
    </div>
  );
}

function SelectField({ label, options }) {
  return (
    <div>
      <label className="mb-sm block font-label-md text-on-surface-variant">{label}</label>
      <select className="w-full cursor-pointer appearance-none rounded-xl border border-outline-variant bg-surface-container-lowest px-md py-md focus:border-secondary focus:ring-2 focus:ring-secondary">
        <option value="">Chọn...</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
