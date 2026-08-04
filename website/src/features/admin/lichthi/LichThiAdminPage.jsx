import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, Printer, RefreshCw, MoreVertical, Eye, Edit, UserPlus, Trash2 } from "lucide-react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import {
  getLichThi,
  createLichThi,
  updateLichThi,
  deleteLichThi,
  autoGenerateLichThi
} from "../../../api/lichthiApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getPhanCongDay } from "../../../api/phancongDayApi.js";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import PdfPreviewModal from "../../../components/common/PdfPreviewModal.jsx";
import { notifySuccess, notifyError } from "../../../utils/notify.js";
import { useConfirm } from "../../../contexts/ConfirmContext.jsx";

export default function LichThiAdminPage() {
  const { confirm } = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    namHoc: "",
    hocKy: "Học kỳ II",
    khoi: "",
    lop: "",
    monThi: "",
    ngayThi: "",
  });
  
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfHtmlContent, setPdfHtmlContent] = useState("");

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

  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [autoForm, setAutoForm] = useState({
    namHoc: "",
    hocKy: 2,
    tuan: 27, 
    loaiKiemTra: "GK"
  });

  // Sync autoForm with filter when modal opens
  useEffect(() => {
    if (autoModalOpen) {
      const hk = filter.hocKy?.includes("II") ? 2 : 1;
      setAutoForm(p => ({
        ...p,
        namHoc: filter.namHoc || namHocList[0] || "",
        hocKy: hk,
        tuan: hk === 1 ? 9 : 27
      }));
    }
  }, [autoModalOpen]);

  const [lops, setLops] = useState([]);
  const [monHocs, setMonHocs] = useState([]);
  const [namHocList, setNamHocList] = useState([]);
  const [giaoViens, setGiaoViens] = useState([]);
  const [phanCongList, setPhanCongList] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const giamThiRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
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

        const namData = namRes?.data?.data || [];
        const years = namData
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean)
          .sort((a, b) => {
            const yearA = Number(String(a).match(/(\d{4})/)?.[1] || 0);
            const yearB = Number(String(b).match(/(\d{4})/)?.[1] || 0);
            return yearB - yearA;
          });
        setNamHocList(years);

        if (namData.length > 0 && !filter.namHoc) {
          const activeYear = namData.find(n => n.trangThai === "DANG_MO");
          setFilter((prev) => ({ ...prev, namHoc: activeYear?.tenNamHoc || years[0] }));
        }
      })
      .catch(() => {
        setItems([]);
        setLops([]);
        setMonHocs([]);
        setGiaoViens([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-dropdown-container')) {
        setOpenDropdownId(null);
      }
      if (!e.target.closest('.add-menu-container')) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.filter((item) => {
      if (!item) return false;
      if (filter.namHoc && item.namHoc && item.namHoc !== filter.namHoc) return false;
      if (filter.hocKy) {
        const parsed = filter.hocKy.includes("II") ? 2 : 1;
        if (item.hocKy && Number(item.hocKy) !== parsed) return false;
      }
      if (filter.khoi) {
        const match = filter.khoi.match(/\d+/);
        const num = match ? Number(match[0]) : null;
        if (num && item.lop && Number(item.lop.khoi) !== num) return false;
      }
      if (filter.lop && item.lop && filter.lop !== item.lop.tenLop) return false;
      if (filter.monThi && item.monHoc && item.monHoc.tenMon !== filter.monThi) return false;
      if (filter.ngayThi && item.ngayThi !== filter.ngayThi) return false;
      return true;
    });
  }, [items, filter]);

  const handleExportPdf = (singleRow = null) => {
    const dataToExport = singleRow ? [singleRow] : filteredItems;
    if (!dataToExport.length) {
      notifyError("Không có dữ liệu để xuất.");
      return;
    }

    const namHoc = filter.namHoc || namHocList[0] || "";
    const hocKy = filter.hocKy?.includes("II") ? 2 : 1;

    // Sort by ngayThi, gioBatDau
    const sorted = [...dataToExport].sort((a, b) => {
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
      </body></html>`;

    setPdfHtmlContent(html);
    setShowPdfPreview(true);
  };

  const calculateCaThi = (gioBatDau) => {
    if (!gioBatDau) return "—";
    const hour = parseInt(gioBatDau.split(":")[0]);
    return hour < 12 ? "Sáng" : "Chiều";
  };

  const getStatus = (ngayThi, gioBatDau, thoiGianLamBai) => {
    if (!ngayThi || !gioBatDau) return { label: "Đã lên lịch", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
    
    const now = new Date();
    const [y, m, d] = ngayThi.split("-").map(Number);
    const [h, min] = gioBatDau.split(":").map(Number);
    
    const start = new Date(y, m - 1, d, h, min, 0);
    const end = new Date(start.getTime() + (thoiGianLamBai || 90) * 60000);
    const diffDays = (start - now) / (1000 * 60 * 60 * 24);

    if (now > end) {
      return { label: "Đã kết thúc", color: "bg-slate-100 text-slate-600 border border-slate-200" };
    }
    if (now >= start && now <= end) {
      return { label: "Đang diễn ra", color: "bg-blue-50 text-blue-700 border border-blue-200" };
    }
    if (diffDays > 0 && diffDays <= 7) {
      return { label: "Sắp diễn ra", color: "bg-amber-50 text-amber-700 border border-amber-200" };
    }
    
    return { label: "Đã lên lịch", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const [y, m, d] = dateString.split("-");
    return `${d}/${m}/${y}`;
  };

  const calculateEndTime = (gioBatDau, thoiGianLamBai) => {
    if (!gioBatDau) return "—";
    const [h, min] = gioBatDau.split(":").map(Number);
    const date = new Date(2000, 0, 1, h, min + (thoiGianLamBai || 90));
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const openForm = (row = null, scrollGiamThi = false) => {
    setEditing(row);
    if (row) {
      setForm({
        lopId: row.lop?.id || "",
        monHocId: row.monHoc?.id || "",
        loaiKiemTra: row.loaiKiemTra || "CK",
        ngayThi: row.ngayThi || "",
        gioBatDau: row.gioBatDau ? String(row.gioBatDau).slice(0, 5) : "08:00",
        thoiGianLamBai: row.thoiGianLamBai || 90,
        phong: row.phongThi || "",
        hocKy: row.hocKy || 2,
        namHoc: row.namHoc || filter.namHoc,
        giamThi1Id: row.giamThi1?.id || "",
        giamThi2Id: row.giamThi2?.id || "",
      });
    } else {
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
    }
    setModalOpen(true);
    if (scrollGiamThi) {
      setTimeout(() => {
        giamThiRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lịch thi"
        description="Quản lý lịch thi theo năm học, học kỳ và khối lớp."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExportPdf()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Xuất PDF
            </button>
            
            <div className="relative add-menu-container">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Tạo lịch thi
              </button>
              
              {showAddMenu && (
                <div className="absolute right-0 top-12 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 overflow-hidden">
                  <button
                    onClick={() => { setShowAddMenu(false); openForm(); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-blue-500" /> Thêm thủ công
                  </button>
                  <button
                    onClick={() => { setShowAddMenu(false); setAutoModalOpen(true); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-500" /> Tạo tự động (Cả trường)
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* Filter Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Năm học</label>
            <select
              value={filter.namHoc}
              onChange={(e) => setFilter(p => ({ ...p, namHoc: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả</option>
              {namHocList.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Học kỳ</label>
            <select
              value={filter.hocKy}
              onChange={(e) => setFilter(p => ({ ...p, hocKy: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="Học kỳ I">Học kỳ I</option>
              <option value="Học kỳ II">Học kỳ II</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Khối</label>
            <select
              value={filter.khoi}
              onChange={(e) => setFilter(p => ({ ...p, khoi: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="Khối 10">Khối 10</option>
              <option value="Khối 11">Khối 11</option>
              <option value="Khối 12">Khối 12</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Lớp</label>
            <select
              value={filter.lop}
              onChange={(e) => setFilter(p => ({ ...p, lop: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả</option>
              {[...new Set(lops.map(l => l.tenLop))].sort((a,b) => a.localeCompare(b, "vi", {numeric: true})).map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Môn thi</label>
            <select
              value={filter.monThi}
              onChange={(e) => setFilter(p => ({ ...p, monThi: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả</option>
              {[...new Set(monHocs.map(m => m.tenMon))].sort().map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Ngày thi</label>
            <input
              type="date"
              value={filter.ngayThi}
              onChange={(e) => setFilter(p => ({ ...p, ngayThi: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              fetchData();
              setFilter(p => ({ ...p, khoi: "", lop: "", monThi: "", ngayThi: "" }));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-blue-50/50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">STT</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Môn thi</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Khối</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Lớp</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Phòng thi</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Ca thi</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Thời gian</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Giám thị 1</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Giám thị 2</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center text-slate-500">Không tìm thấy lịch thi nào phù hợp.</td>
                </tr>
              ) : (
                filteredItems.map((row, idx) => {
                  const status = getStatus(row.ngayThi, row.gioBatDau, row.thoiGianLamBai);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors group even:bg-slate-50/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{row.monHoc?.tenMon || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-700">{row.lop?.khoi || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-700">{row.lop?.tenLop || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-slate-700">{row.phongThi || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-700">{calculateCaThi(row.gioBatDau)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{formatDate(row.ngayThi)}</span>
                          <span className="text-slate-500 mt-0.5">{row.gioBatDau ? String(row.gioBatDau).slice(0, 5) : "—"} - {calculateEndTime(row.gioBatDau, row.thoiGianLamBai)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{row.giamThi1?.hoTen || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{row.giamThi2?.hoTen || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative action-dropdown-container">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === row.id ? null : row.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {openDropdownId === row.id && (
                          <div className="absolute right-8 top-10 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 overflow-hidden">
                            <button
                              onClick={() => { setOpenDropdownId(null); openForm(row); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4 text-slate-400" /> Xem chi tiết
                            </button>
                            <button
                              onClick={() => { setOpenDropdownId(null); openForm(row); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4 text-slate-400" /> Chỉnh sửa
                            </button>
                            <button
                              onClick={() => { setOpenDropdownId(null); openForm(row, true); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <UserPlus className="w-4 h-4 text-slate-400" /> Phân công giám thị
                            </button>
                            <button
                              onClick={() => { setOpenDropdownId(null); handleExportPdf(row); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Printer className="w-4 h-4 text-slate-400" /> In lịch thi
                            </button>
                            <div className="h-px bg-slate-100 my-1"></div>
                            <button
                              onClick={async () => {
                                setOpenDropdownId(null);
                                if (!(await confirm("Xóa lịch thi này?"))) return;
                                try {
                                  await deleteLichThi(row.id);
                                  fetchData();
                                  notifySuccess("Đã xóa lịch thi.");
                                } catch {
                                  notifyError("Không thể xóa lịch thi.");
                                }
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" /> Xóa
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SimpleModal
        open={modalOpen}
        title={editing ? "Cập nhật lịch thi" : "Thêm lịch thi"}
        onClose={() => setModalOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();

            if (form.ngayThi && form.namHoc && form.hocKy) {
              const ngayThi = new Date(form.ngayThi);
              const [startYear] = form.namHoc.split("-").map(Number);
              const hocKy = Number(form.hocKy);

              let startDate, endDate;
              if (hocKy === 1) {
                startDate = new Date(startYear, 8, 1);
                endDate = new Date(startYear, 11, 31);
              } else {
                startDate = new Date(startYear + 1, 0, 1);
                endDate = new Date(startYear + 1, 4, 31);
              }

              if (ngayThi < startDate || ngayThi > endDate) {
                const hkLabel = hocKy === 1 ? "Học kỳ I" : "Học kỳ II";
                const startStr = `${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}`;
                const endStr = `${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}`;
                notifyError(`Ngày thi phải nằm trong ${hkLabel} (${startStr} - ${endStr})`);
                return;
              }
            }

            try {
              const payload = {
                lop: form.lopId ? { id: Number(form.lopId) } : null,
                monHoc: form.monHocId ? { id: Number(form.monHocId) } : null,
                loaiKiemTra: form.loaiKiemTra,
                ngayThi: form.ngayThi,
                gioBatDau: form.gioBatDau?.length === 5 ? form.gioBatDau + ":00" : form.gioBatDau,
                thoiGianLamBai: Number(form.thoiGianLamBai),
                phongThi: form.phong,
                hocKy: Number(form.hocKy),
                namHoc: form.namHoc,
                giamThi1: form.giamThi1Id ? { id: Number(form.giamThi1Id) } : null,
                giamThi2: form.giamThi2Id ? { id: Number(form.giamThi2Id) } : null,
              };
              if (editing?.id) {
                await updateLichThi(editing.id, payload);
                notifySuccess("Cập nhật lịch thi thành công.");
              } else {
                await createLichThi(payload);
                notifySuccess("Thêm lịch thi thành công.");
              }
              fetchData();
              setModalOpen(false);
            } catch (err) {
              const msg = err?.response?.data?.message || "Không thể lưu lịch thi.";
              notifyError(msg);
            }
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 text-sm font-semibold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">Thông tin lịch thi</div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Lớp <span className="text-red-500">*</span></label>
              <select
                value={form.lopId}
                onChange={(e) => {
                  const lopId = e.target.value;
                  const selectedLop = lops.find((l) => String(l.id) === lopId);
                  let autoPhong = "";
                  if (selectedLop?.tenLop) {
                    const gradeMatch = selectedLop.tenLop.match(/^(10|11|12)/);
                    const numMatch = selectedLop.tenLop.match(/(\d+)$/);
                    if (gradeMatch && numMatch) {
                      const grade = parseInt(gradeMatch[1]);
                      const num = parseInt(numMatch[1]);
                      const offset = (grade - 10) * 5;
                      autoPhong = "P" + String(offset + num).padStart(2, "0");
                    }
                  }
                  if (form.loaiKiemTra === "TX" && form.monHocId && lopId) {
                    const pc = phanCongList.find(p => String(p.lopId ?? p.lop?.id) === lopId && String(p.monHocId ?? p.monHoc?.id) === form.monHocId);
                    if (pc) {
                      const gvId = String(pc.giaoVienId ?? pc.giaoVien?.id ?? "");
                      setForm(p => ({ ...p, lopId, phong: autoPhong, giamThi1Id: gvId, giamThi2Id: gvId === form.giamThi2Id ? "" : form.giamThi2Id }));
                      return;
                    }
                  }
                  setForm(p => ({ ...p, lopId, phong: autoPhong }));
                }}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn lớp</option>
                {lops.map(l => <option key={l.id} value={l.id}>{l.tenLop}</option>)}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Môn thi <span className="text-red-500">*</span></label>
              <select
                value={form.monHocId}
                onChange={(e) => {
                  const newMonId = e.target.value;
                  if (form.loaiKiemTra === "TX" && form.lopId && newMonId) {
                    const pc = phanCongList.find(p => String(p.lopId ?? p.lop?.id) === form.lopId && String(p.monHocId ?? p.monHoc?.id) === newMonId);
                    if (pc) {
                      const gvId = String(pc.giaoVienId ?? pc.giaoVien?.id ?? "");
                      setForm(p => ({ ...p, monHocId: newMonId, giamThi1Id: gvId, giamThi2Id: gvId === form.giamThi2Id ? "" : form.giamThi2Id }));
                      return;
                    }
                  }
                  setForm(p => ({ ...p, monHocId: newMonId }));
                }}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn môn</option>
                {monHocs.map(m => <option key={m.id} value={m.id}>{m.tenMon}</option>)}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Loại kiểm tra</label>
              <select
                value={form.loaiKiemTra}
                onChange={(e) => {
                  const newLoai = e.target.value;
                  if (newLoai === "TX" && form.lopId && form.monHocId) {
                    const pc = phanCongList.find(p => String(p.lopId ?? p.lop?.id) === form.lopId && String(p.monHocId ?? p.monHoc?.id) === form.monHocId);
                    if (pc) {
                      const gvId = String(pc.giaoVienId ?? pc.giaoVien?.id ?? "");
                      setForm(p => ({ ...p, loaiKiemTra: newLoai, giamThi1Id: gvId, giamThi2Id: gvId === form.giamThi2Id ? "" : form.giamThi2Id, thoiGianLamBai: 15 }));
                      return;
                    }
                  }
                  setForm(p => ({ ...p, loaiKiemTra: newLoai }));
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="GK">Giữa kỳ</option>
                <option value="CK">Cuối kỳ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Phòng thi</label>
              <select
                value={form.phong}
                onChange={(e) => setForm(p => ({ ...p, phong: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn phòng</option>
                {Array.from({ length: 15 }, (_, i) => "P" + String(i + 1).padStart(2, "0")).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Ngày thi <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.ngayThi}
                onChange={(e) => setForm(p => ({ ...p, ngayThi: e.target.value }))}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Giờ bắt đầu <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  value={form.gioBatDau}
                  onChange={(e) => setForm(p => ({ ...p, gioBatDau: e.target.value }))}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Thời gian <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.thoiGianLamBai}
                    onChange={(e) => setForm(p => ({ ...p, thoiGianLamBai: Number(e.target.value) }))}
                    min={10}
                    required
                    className="w-full border border-slate-300 rounded-lg pr-10 pl-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">phút</span>
                </div>
              </div>
            </div>

            <div className="col-span-2 text-sm font-semibold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 mt-2">Giám thị</div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Giám thị 1</label>
              <select
                value={form.giamThi1Id}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm(p => ({ ...p, giamThi1Id: val, giamThi2Id: val === form.giamThi2Id ? "" : form.giamThi2Id }));
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn giám thị 1</option>
                {giaoViens.map(gv => <option key={gv.id} value={gv.id}>{gv.hoTen}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Giám thị 2</label>
              <select
                value={form.giamThi2Id}
                onChange={(e) => setForm(p => ({ ...p, giamThi2Id: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn giám thị 2</option>
                {giaoViens.filter(gv => String(gv.id) !== form.giamThi1Id).map(gv => <option key={gv.id} value={gv.id}>{gv.hoTen}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              {editing ? "Cập nhật" : "Tạo lịch thi"}
            </button>
          </div>
        </form>
      </SimpleModal>

      {/* PDF PREVIEW MODAL */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        htmlContent={pdfHtmlContent}
        title="Xem trước Lịch thi"
      />

      {/* Modal Tự động tạo lịch */}
      <SimpleModal
        open={autoModalOpen}
        title="Tự động tạo lịch thi"
        onClose={() => setAutoModalOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            
            try {
              await autoGenerateLichThi(autoForm);
              notifySuccess("Đã tạo lịch thi tự động thành công!");
              setAutoModalOpen(false);
              
              // Tự động chuyển bộ lọc sang học kỳ vừa tạo để thấy ngay lập tức
              setFilter(prev => ({
                ...prev,
                namHoc: autoForm.namHoc,
                hocKy: autoForm.hocKy === 1 ? "Học kỳ I" : "Học kỳ II"
              }));

              fetchData();
            } catch (err) {
              notifyError(err?.response?.data?.message || "Không thể tạo lịch thi tự động.");
            }
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Năm học <span className="text-red-500">*</span></label>
              <select
                value={autoForm.namHoc}
                onChange={(e) => setAutoForm(p => ({ ...p, namHoc: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Chọn --</option>
                {namHocList.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Học kỳ <span className="text-red-500">*</span></label>
              <select
                value={autoForm.hocKy}
                onChange={(e) => {
                  const hk = Number(e.target.value);
                  setAutoForm(p => ({
                    ...p,
                    hocKy: hk,
                    tuan: p.loaiKiemTra === "GK" ? (hk === 1 ? 9 : 27) : (hk === 1 ? 18 : 36)
                  }));
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={1}>Học kỳ I</option>
                <option value={2}>Học kỳ II</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Kỳ thi <span className="text-red-500">*</span></label>
              <select
                value={autoForm.loaiKiemTra}
                onChange={(e) => {
                  const lkt = e.target.value;
                  setAutoForm(p => ({
                    ...p,
                    loaiKiemTra: lkt,
                    tuan: lkt === "GK" ? (p.hocKy === 1 ? 9 : 27) : (p.hocKy === 1 ? 18 : 36)
                  }));
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="GK">Giữa kỳ</option>
                <option value="CK">Cuối kỳ</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Tuần thi <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={1}
                max={52}
                value={autoForm.tuan}
                onChange={(e) => setAutoForm(p => ({ ...p, tuan: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAutoModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ backgroundColor: "#10b981", color: "#ffffff" }}
            >
              Bắt đầu tạo
            </button>
          </div>
        </form>
      </SimpleModal>

    </div>
  );
}
