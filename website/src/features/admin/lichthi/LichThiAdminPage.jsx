import { useEffect, useMemo, useRef, useState } from "react";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import {
  getLichThi,
  createLichThi,
  updateLichThi,
  deleteLichThi,
  exportLichThiPdf,
} from "../../../api/lichthiApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getPhanCongDay } from "../../../api/phancongDayApi.js";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

export default function LichThiAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    namHoc: "",
    hocKy: "Học kỳ II",
    khoi: "Khối 10",
    lop: "10A1",
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    lopId: "",
    monHocId: "",
    loaiKiemTra: "CK",
    ngayThi: "",
    gioBatDau: "08:00",
    thoiGianLamBai: 90,
    phong: "",
    hocKy: 2,
    namHoc: "",
    giamThi1Id: "",
    giamThi2Id: "",
  });
  const [lops, setLops] = useState([]);
  const [monHocs, setMonHocs] = useState([]);
  const [namHocList, setNamHocList] = useState([]);
  const [giaoViens, setGiaoViens] = useState([]);
  const [phanCongList, setPhanCongList] = useState([]);
  const filterRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getLichThi(),
      getLop(),
      getMonHoc(),
      getNamHoc(),
      getGiaoVien(),
      getPhanCongDay(),
    ])
      .then(([lichRes, lopRes, monRes, namRes, gvRes, pcRes]) => {
        setItems(lichRes?.data?.data || []);
        setLops(lopRes?.data?.data || []);
        setMonHocs(monRes?.data?.data || []);
        setGiaoViens(gvRes?.data?.data || []);
        setPhanCongList(pcRes?.data?.data || []);

        const years = (namRes?.data?.data || [])
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean)
          .sort((a, b) => {
            const yearA = Number(String(a).match(/(\d{4})/)?.[1] || 0);
            const yearB = Number(String(b).match(/(\d{4})/)?.[1] || 0);
            return yearB - yearA;
          });
        setNamHocList(years);

        if (years.length > 0) {
          setFilter((prev) => ({ ...prev, namHoc: prev.namHoc || years[0] }));
          setForm((prev) => ({ ...prev, namHoc: prev.namHoc || years[0] }));
        }
      })
      .catch(() => {
        setItems([]);
        setLops([]);
        setMonHocs([]);
        setGiaoViens([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.filter((item) => {
      if (!item) return false;
      if (filter.namHoc && item.namHoc && item.namHoc !== filter.namHoc)
        return false;
      if (filter.hocKy) {
        const parsed = filter.hocKy.includes("II") ? 2 : 1;
        if (item.hocKy && Number(item.hocKy) !== parsed) return false;
      }
      if (filter.khoi) {
        const match = filter.khoi.match(/\d+/);
        const num = match ? Number(match[0]) : null;
        if (num && item.lop && Number(item.lop.khoi) !== num) return false;
      }
      if (filter.lop && item.lop && filter.lop !== item.lop.tenLop)
        return false;
      return true;
    });
  }, [items, filter]);

  const hasFilter = Boolean(
    filter.namHoc || filter.hocKy || filter.khoi || filter.lop,
  );

  const handleExportPdf = () => {
    if (!filteredItems.length) {
      notifyError("Không có dữ liệu để xuất.");
      return;
    }

    const namHoc = filter.namHoc || namHocList[0] || "";
    const hocKy = filter.hocKy?.includes("II") ? 2 : 1;

    // Sort by ngayThi, gioBatDau
    const sorted = [...filteredItems].sort((a, b) => {
      const cmp = (a.ngayThi || "").localeCompare(b.ngayThi || "");
      if (cmp !== 0) return cmp;
      return (a.gioBatDau || "").localeCompare(b.gioBatDau || "");
    });

    // Group by ngayThi
    const grouped = {};
    sorted.forEach((item) => {
      const ngay = item.ngayThi || "Chưa xác định";
      if (!grouped[ngay]) grouped[ngay] = [];
      grouped[ngay].push(item);
    });

    let tableRows = "";
    Object.entries(grouped).forEach(([ngay, items]) => {
      items.forEach((item, idx) => {
        tableRows += "<tr>";
        if (idx === 0) {
          tableRows += `<td rowspan="${items.length}" style="background:#e3f2fd;font-weight:bold;text-align:center;border:1px solid #ccc;padding:8px">${ngay}</td>`;
        }
        tableRows += `<td style="border:1px solid #ccc;padding:8px;text-align:center;font-weight:600">${item.lop?.tenLop || "—"}</td>`;
        tableRows += `<td style="border:1px solid #ccc;padding:8px"><b>${item.monHoc?.tenMon || "—"}</b></td>`;
        tableRows += `<td style="border:1px solid #ccc;padding:8px;text-align:center">${item.loaiKiemTra || "—"}</td>`;
        tableRows += `<td style="border:1px solid #ccc;padding:8px;text-align:center">${item.gioBatDau ? String(item.gioBatDau).slice(0, 5) : "—"}</td>`;
        tableRows += `<td style="border:1px solid #ccc;padding:8px;text-align:center">${item.thoiGianLamBai || "—"} phút</td>`;
        tableRows += `<td style="border:1px solid #ccc;padding:8px;text-align:center">${item.phongThi || "—"}</td>`;
        tableRows += `<td style="border:1px solid #ccc;padding:8px">${item.giamThi1?.hoTen || "—"}</td>`;
        tableRows += `<td style="border:1px solid #ccc;padding:8px">${item.giamThi2?.hoTen || "—"}</td>`;
        tableRows += "</tr>";
      });
    });

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Lịch thi ${namHoc} HK${hocKy}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px}
        h1{text-align:center;font-size:18px;margin-bottom:5px}
        h2{text-align:center;font-size:14px;color:#555;margin-top:0}
        table{border-collapse:collapse;width:100%;margin-top:16px}
        th{background:#1565c0;color:white;padding:8px;border:1px solid #ccc;text-align:center;font-size:12px}
        @media print{body{padding:0} @page{size:landscape;margin:10mm}}
      </style></head><body>
      <h1>LỊCH THI - Năm học ${namHoc} - Học kỳ ${hocKy}</h1>
      <h2>Tổng số: ${sorted.length} lịch thi</h2>
      <table>
        <thead><tr>
          <th>Ngày thi</th>
          <th>Lớp</th>
          <th>Môn thi</th>
          <th>Loại KT</th>
          <th>Giờ bắt đầu</th>
          <th>Thời gian</th>
          <th>Phòng thi</th>
          <th>Giám thị 1</th>
          <th>Giám thị 2</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      notifyError("Trình duyệt chặn popup. Vui lòng cho phép popup để in PDF.");
    }
  };

  return (
    <div className="space-y-lg">
      <PageHeader
        title="Lịch thi"
        description="Quản lý lịch thi theo năm học, học kỳ và khối lớp."
        actions={
          <>
            <div className="filter-dropdown-wrap" ref={filterRef}>
              <button
                type="button"
                className={`btn-outline filter-toggle ${hasFilter ? "filter-active" : ""}`}
                onClick={() => setFilterOpen((current) => !current)}
                title="Lọc"
                aria-label="Lọc lịch thi"
              >
                <MaterialIcon name="filter_list" />
                {hasFilter && <span className="filter-dot" />}
              </button>

              {filterOpen && (
                <div className="filter-dropdown">
                  <div className="filter-dropdown-title">Bộ lọc lịch thi</div>
                  <label className="filter-dropdown-label">
                    <span>Năm học</span>
                    <select
                      value={filter.namHoc}
                      onChange={(e) =>
                        setFilter((p) => ({ ...p, namHoc: e.target.value }))
                      }
                    >
                      <option value="">Tất cả</option>
                      {namHocList.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="filter-dropdown-label">
                    <span>Học kỳ</span>
                    <select
                      value={filter.hocKy}
                      onChange={(e) =>
                        setFilter((p) => ({ ...p, hocKy: e.target.value }))
                      }
                    >
                      <option value="">Tất cả</option>
                      <option value="Học kỳ II">Học kỳ II</option>
                      <option value="Học kỳ I">Học kỳ I</option>
                    </select>
                  </label>
                  <label className="filter-dropdown-label">
                    <span>Khối</span>
                    <select
                      value={filter.khoi}
                      onChange={(e) =>
                        setFilter((p) => ({ ...p, khoi: e.target.value }))
                      }
                    >
                      <option value="">Tất cả</option>
                      <option value="Khối 10">Khối 10</option>
                      <option value="Khối 11">Khối 11</option>
                      <option value="Khối 12">Khối 12</option>
                    </select>
                  </label>
                  <label className="filter-dropdown-label">
                    <span>Lớp</span>
                    <select
                      value={filter.lop}
                      onChange={(e) =>
                        setFilter((p) => ({ ...p, lop: e.target.value }))
                      }
                    >
                      <option value="">Tất cả</option>
                      {[...new Set(lops.map((c) => c.tenLop))]
                        .sort((a, b) =>
                          a.localeCompare(b, "vi", { numeric: true }),
                        )
                        .map((className) => (
                          <option key={className} value={className}>
                            {className}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="filter-clear"
                    onClick={() => {
                      setFilter((prev) => ({
                        ...prev,
                        hocKy: "",
                        khoi: "",
                        lop: "",
                      }));
                      setFilterOpen(false);
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-outline flex items-center gap-sm"
              onClick={handleExportPdf}
            >
              <MaterialIcon name="picture_as_pdf" /> Xuất PDF
            </button>

            <button
              type="button"
              className="btn-primary flex items-center gap-sm"
              onClick={() => {
                setEditing(null);
                setForm({
                  lopId: "",
                  monHocId: "",
                  loaiKiemTra: "CK",
                  ngayThi: "",
                  gioBatDau: "08:00",
                  thoiGianLamBai: 90,
                  phong: "",
                  hocKy: 2,
                  namHoc: filter.namHoc || namHocList[0] || "",
                  giamThi1Id: "",
                  giamThi2Id: "",
                });
                setModalOpen(true);
              }}
            >
              <MaterialIcon name="add" /> Thêm lịch thi
            </button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        <section className="col-span-12 overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
          <div className="flex items-center justify-between border-b border-outline-variant px-lg py-md">
            <h3 className="text-headline-md font-semibold text-primary">
              Danh sách lịch thi
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-high/50 font-label-md">
                  <th className="px-lg py-4">Môn thi</th>
                  <th className="px-lg py-4 text-center">Lớp</th>
                  <th className="px-lg py-4 text-center">Ngày thi</th>
                  <th className="px-lg py-4">Giám thị 1</th>
                  <th className="px-lg py-4">Giám thị 2</th>
                  <th className="px-lg py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-lg py-8 text-center text-outline"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-lg py-8 text-center text-outline"
                    >
                      Không tìm thấy lịch thi phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-surface-container-low"
                    >
                      <td className="px-lg py-4 font-label-md">
                        {row.monHoc?.tenMon || "—"}
                      </td>
                      <td className="px-lg py-4 text-center text-body-sm">
                        {row.lop?.tenLop || "—"}
                      </td>
                      <td className="px-lg py-4 text-center text-body-sm">
                        {row.ngayThi}
                      </td>
                      <td className="px-lg py-4 text-body-sm font-medium">
                        {row.giamThi1?.hoTen || "—"}
                      </td>
                      <td className="px-lg py-4 text-body-sm">
                        {row.giamThi2?.hoTen || "—"}
                      </td>
                      <td className="px-lg py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                            onClick={() => {
                              setEditing(row);
                              setForm({
                                lopId: row.lop?.id || "",
                                monHocId: row.monHoc?.id || "",
                                loaiKiemTra: row.loaiKiemTra || "CK",
                                ngayThi: row.ngayThi || "",
                                gioBatDau: row.gioBatDau
                                  ? String(row.gioBatDau).slice(0, 5)
                                  : "08:00",
                                thoiGianLamBai: row.thoiGianLamBai || 90,
                                phong: row.phongThi || "",
                                hocKy: row.hocKy || 2,
                                namHoc: row.namHoc || filter.namHoc,
                                giamThi1Id: row.giamThi1?.id || "",
                                giamThi2Id: row.giamThi2?.id || "",
                              });
                              setModalOpen(true);
                            }}
                          >
                            <MaterialIcon name="edit" className="text-[20px]" />
                          </button>
                          <button
                            type="button"
                            className="p-2 text-danger hover:bg-danger/10 rounded-lg"
                            onClick={async () => {
                              if (!window.confirm("Xóa lịch thi này?")) return;
                              try {
                                await deleteLichThi(row.id);
                                setItems((prev) =>
                                  prev.filter((i) => i.id !== row.id),
                                );
                                notifySuccess("Đã xóa lịch thi.");
                              } catch {
                                notifyError("Không thể xóa lịch thi.");
                              }
                            }}
                          >
                            <MaterialIcon
                              name="delete"
                              className="text-[20px]"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <SimpleModal
        open={modalOpen}
        title={editing ? "Cập nhật lịch thi" : "Thêm lịch thi"}
        onClose={() => setModalOpen(false)}
      >
        <form
          className="form-grid"
          onSubmit={async (e) => {
            e.preventDefault();

            // Kiểm tra ngày thi nằm trong năm học và học kỳ
            if (form.ngayThi && form.namHoc && form.hocKy) {
              const ngayThi = new Date(form.ngayThi);
              const [startYear] = form.namHoc.split("-").map(Number);
              const hocKy = Number(form.hocKy);

              let startDate, endDate;
              if (hocKy === 1) {
                // Học kỳ I: 01/09 năm bắt đầu -> 31/12 năm bắt đầu
                startDate = new Date(startYear, 8, 1); // September 1
                endDate = new Date(startYear, 11, 31); // December 31
              } else {
                // Học kỳ II: 01/01 năm kết thúc -> 31/05 năm kết thúc
                startDate = new Date(startYear + 1, 0, 1); // January 1
                endDate = new Date(startYear + 1, 4, 31); // May 31
              }

              if (ngayThi < startDate || ngayThi > endDate) {
                const hkLabel = hocKy === 1 ? "Học kỳ I" : "Học kỳ II";
                const startStr = `${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}`;
                const endStr = `${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}`;
                notifyError(
                  `Ngày thi phải nằm trong ${hkLabel} (${startStr} - ${endStr})`,
                );
                return;
              }
            }

            try {
              const payload = {
                lop: form.lopId ? { id: Number(form.lopId) } : null,
                monHoc: form.monHocId ? { id: Number(form.monHocId) } : null,
                loaiKiemTra: form.loaiKiemTra,
                ngayThi: form.ngayThi,
                gioBatDau:
                  form.gioBatDau?.length === 5
                    ? form.gioBatDau + ":00"
                    : form.gioBatDau,
                thoiGianLamBai: Number(form.thoiGianLamBai),
                phongThi: form.phong,
                hocKy: Number(form.hocKy),
                namHoc: form.namHoc,
                giamThi1: form.giamThi1Id
                  ? { id: Number(form.giamThi1Id) }
                  : null,
                giamThi2: form.giamThi2Id
                  ? { id: Number(form.giamThi2Id) }
                  : null,
              };
              if (editing?.id) {
                const res = await updateLichThi(editing.id, payload);
                setItems((prev) =>
                  prev.map((it) =>
                    it.id === editing.id
                      ? res?.data?.data || { ...it, ...payload }
                      : it,
                  ),
                );
                notifySuccess("Cập nhật lịch thi thành công.");
              } else {
                const res = await createLichThi(payload);
                const created = res?.data?.data;
                if (created) setItems((prev) => [created, ...prev]);
                notifySuccess("Thêm lịch thi thành công.");
              }
              setModalOpen(false);
            } catch (err) {
              const msg =
                err?.response?.data?.message || "Không thể lưu lịch thi.";
              notifyError(msg);
            }
          }}
        >
          <div className="form-section-title">Thông tin lịch thi</div>
          <label className="form-field">
            <span>Lớp</span>
            <select
              value={form.lopId}
              onChange={(e) => {
                const lopId = e.target.value;
                const selectedLop = lops.find((l) => String(l.id) === lopId);
                // Tự động điền phòng thi: 10A1→P01, ..., 11A1→P06, ..., 12A1→P11
                let autoPhong = "";
                if (selectedLop?.tenLop) {
                  const gradeMatch = selectedLop.tenLop.match(/^(10|11|12)/);
                  const numMatch = selectedLop.tenLop.match(/(\d+)$/);
                  if (gradeMatch && numMatch) {
                    const grade = parseInt(gradeMatch[1]);
                    const num = parseInt(numMatch[1]);
                    const offset = (grade - 10) * 5; // 10→0, 11→5, 12→10
                    autoPhong = "P" + String(offset + num).padStart(2, "0");
                  }
                }
                // Nếu đã chọn TX + môn, tự động tìm giáo viên dạy môn đó cho lớp mới
                if (form.loaiKiemTra === "TX" && form.monHocId && lopId) {
                  const pc = phanCongList.find(
                    (p) =>
                      String(p.lopId ?? p.lop?.id) === lopId &&
                      String(p.monHocId ?? p.monHoc?.id) === form.monHocId,
                  );
                  if (pc) {
                    const gvId = String(pc.giaoVienId ?? pc.giaoVien?.id ?? "");
                    const newGiamThi2Id =
                      gvId === form.giamThi2Id ? "" : form.giamThi2Id;
                    setForm((p) => ({
                      ...p,
                      lopId,
                      phong: autoPhong,
                      giamThi1Id: gvId,
                      giamThi2Id: newGiamThi2Id,
                    }));
                    return;
                  }
                }
                setForm((p) => ({ ...p, lopId, phong: autoPhong }));
              }}
              required
            >
              <option value="">Chọn lớp</option>
              {lops.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.tenLop}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Môn thi</span>
            <select
              value={form.monHocId}
              onChange={(e) => {
                const newMonId = e.target.value;
                // Nếu đang chọn TX và đã có lớp, tự động tìm giám thị
                if (form.loaiKiemTra === "TX" && form.lopId && newMonId) {
                  const pc = phanCongList.find(
                    (p) =>
                      String(p.lopId ?? p.lop?.id) === form.lopId &&
                      String(p.monHocId ?? p.monHoc?.id) === newMonId,
                  );
                  if (pc) {
                    const gvId = String(pc.giaoVienId ?? pc.giaoVien?.id ?? "");
                    // Nếu giáo viên này đang là giám thị 2 thì reset giám thị 2
                    const newGiamThi2Id =
                      gvId === form.giamThi2Id ? "" : form.giamThi2Id;
                    setForm((p) => ({
                      ...p,
                      monHocId: newMonId,
                      giamThi1Id: gvId,
                      giamThi2Id: newGiamThi2Id,
                    }));
                    return;
                  }
                }
                setForm((p) => ({ ...p, monHocId: newMonId }));
              }}
              required
            >
              <option value="">Chọn môn</option>
              {monHocs.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.tenMon}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Loại kiểm tra</span>
            <select
              value={form.loaiKiemTra}
              onChange={(e) => {
                const newLoai = e.target.value;
                if (newLoai === "TX" && form.lopId && form.monHocId) {
                  // Tìm giáo viên dạy môn đó cho lớp đó từ phan_cong_day
                  const pc = phanCongList.find(
                    (p) =>
                      String(p.lopId ?? p.lop?.id) === form.lopId &&
                      String(p.monHocId ?? p.monHoc?.id) === form.monHocId,
                  );
                  if (pc) {
                    const gvId = String(pc.giaoVienId ?? pc.giaoVien?.id ?? "");
                    // Nếu giáo viên này đang là giám thị 2 thì reset giám thị 2
                    const newGiamThi2Id =
                      gvId === form.giamThi2Id ? "" : form.giamThi2Id;
                    setForm((p) => ({
                      ...p,
                      loaiKiemTra: newLoai,
                      giamThi1Id: gvId,
                      giamThi2Id: newGiamThi2Id,
                      thoiGianLamBai: 15,
                    }));
                    return;
                  }
                }
                setForm((p) => ({ ...p, loaiKiemTra: newLoai }));
              }}
            >
              <option value="GK">Giữa kỳ</option>
              <option value="CK">Cuối kỳ</option>
            </select>
          </label>
          <label className="form-field">
            <span>Học kỳ</span>
            <select
              value={form.hocKy}
              onChange={(e) =>
                setForm((p) => ({ ...p, hocKy: Number(e.target.value) }))
              }
            >
              <option value={1}>Học kỳ I</option>
              <option value={2}>Học kỳ II</option>
            </select>
          </label>
          <label className="form-field">
            <span>Ngày thi</span>
            <input
              type="date"
              value={form.ngayThi}
              onChange={(e) =>
                setForm((p) => ({ ...p, ngayThi: e.target.value }))
              }
              required
            />
            {form.namHoc &&
              form.hocKy &&
              (() => {
                const [startYear] = form.namHoc.split("-").map(Number);
                const hocKy = Number(form.hocKy);
                const fmt = (d) =>
                  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                if (hocKy === 1) {
                  return (
                    <small
                      style={{
                        color: "#3b82f6",
                        fontSize: 12,
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      Học kỳ I: {fmt(new Date(startYear, 8, 1))} →{" "}
                      {fmt(new Date(startYear, 11, 31))}
                    </small>
                  );
                } else {
                  return (
                    <small
                      style={{
                        color: "#3b82f6",
                        fontSize: 12,
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      Học kỳ II: {fmt(new Date(startYear + 1, 0, 1))} →{" "}
                      {fmt(new Date(startYear + 1, 4, 31))}
                    </small>
                  );
                }
              })()}
          </label>
          <label className="form-field">
            <span>Giờ bắt đầu</span>
            <input
              type="time"
              value={form.gioBatDau}
              onChange={(e) =>
                setForm((p) => ({ ...p, gioBatDau: e.target.value }))
              }
              required
            />
          </label>
          <label className="form-field">
            <span>Thời gian (phút)</span>
            <input
              type="number"
              value={form.thoiGianLamBai}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  thoiGianLamBai: Number(e.target.value),
                }))
              }
              min={10}
              required
            />
          </label>
          <label className="form-field">
            <span>Phòng thi</span>
            <select
              value={form.phong}
              onChange={(e) =>
                setForm((p) => ({ ...p, phong: e.target.value }))
              }
            >
              <option value="">Chọn phòng</option>
              {Array.from({ length: 15 }, (_, i) => {
                const room = "P" + String(i + 1).padStart(2, "0");
                return (
                  <option key={room} value={room}>
                    {room}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="form-section-title">Giám thị</div>
          <label className="form-field">
            <span>Giám thị 1</span>
            <select
              value={form.giamThi1Id}
              onChange={(e) => {
                const newGiamThi1Id = e.target.value;
                // Nếu chọn trùng giám thị 2 thì reset giám thị 2
                if (newGiamThi1Id && newGiamThi1Id === form.giamThi2Id) {
                  setForm((p) => ({
                    ...p,
                    giamThi1Id: newGiamThi1Id,
                    giamThi2Id: "",
                  }));
                } else {
                  setForm((p) => ({ ...p, giamThi1Id: newGiamThi1Id }));
                }
              }}
            >
              <option value="">Chọn giám thị</option>
              {giaoViens.map((gv) => (
                <option key={gv.id} value={gv.id}>
                  {gv.hoTen}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Giám thị 2</span>
            <select
              value={form.giamThi2Id}
              onChange={(e) =>
                setForm((p) => ({ ...p, giamThi2Id: e.target.value }))
              }
            >
              <option value="">Chọn giám thị</option>
              {giaoViens
                .filter((gv) => String(gv.id) !== form.giamThi1Id)
                .map((gv) => (
                  <option key={gv.id} value={gv.id}>
                    {gv.hoTen}
                  </option>
                ))}
            </select>
          </label>

          <div className="form-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Lưu
            </button>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}
