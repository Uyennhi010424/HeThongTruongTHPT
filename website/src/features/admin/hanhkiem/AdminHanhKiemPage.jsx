import { useEffect, useState, useMemo } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import Pagination from "../../../components/common/Pagination.jsx";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getHanhKiem, saveAllHanhKiem } from "../../../api/hanhkiemApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";
import { getStudentClass, getVisibleAcademicYears, getActiveAcademicYear, sortClasses, sortStudentsByGivenName } from "../../../utils/helpers.js";

export default function AdminHanhKiemPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [namHocList, setNamHocList] = useState([]);

  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("HK1");
  const [selectedNamHoc, setSelectedNamHoc] = useState("");

  const [serverRecords, setServerRecords] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Phân trang
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Tải dữ liệu ban đầu: Lớp, Năm học
  useEffect(() => {
    let active = true;
    const fetchInit = async () => {
      try {
        setLoading(true);
        const [resLop, resNamHoc] = await Promise.all([getLop(), getNamHoc()]);
        if (!active) return;

        const rawLop = resLop?.data?.data || [];
        setClasses(rawLop);

        const rawNamHoc = resNamHoc?.data?.data || [];
        const visibleYears = getVisibleAcademicYears(rawNamHoc);
        const yearsToUse = visibleYears.length > 0 ? visibleYears : rawNamHoc;
        setNamHocList(yearsToUse);

        // Chọn năm học hiện tại
        const activeYear = getActiveAcademicYear(yearsToUse);
        const currentYear = activeYear || yearsToUse[0];
        if (currentYear) {
          setSelectedNamHoc(currentYear.tenNamHoc);
        }
      } catch (err) {
        setError("Không thể tải cấu hình danh sách lớp hoặc năm học.");
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
    return () => { active = false; };
  }, []);

  // Lọc và sắp xếp danh sách lớp theo năm học, khối (10 -> 11 -> 12) và tên lớp
  const filteredClasses = useMemo(() => {
    let list = classes;
    if (selectedNamHoc) {
      list = list.filter((c) => (c.namHoc || c.tenNamHoc) === selectedNamHoc);
    }
    if (selectedGrade !== "all") {
      const gradeNum = parseInt(selectedGrade, 10);
      list = list.filter((c) => c.khoi === gradeNum);
    }
    return list.slice().sort(sortClasses);
  }, [classes, selectedGrade, selectedNamHoc]);

  // Reset lớp đã chọn nếu không nằm trong danh sách lớp lọc
  useEffect(() => {
    if (filteredClasses.length > 0) {
      const exists = filteredClasses.some((c) => String(c.id) === String(selectedClassId));
      if (!exists) {
        setSelectedClassId(String(filteredClasses[0].id));
      }
    } else {
      setSelectedClassId("");
    }
  }, [filteredClasses, selectedClassId]);

  // Tải danh sách học sinh và hạnh kiểm tương ứng
  useEffect(() => {
    if (!selectedClassId || !selectedNamHoc) return;
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Tải học sinh trong lớp và sắp xếp theo bảng chữ cái A-Z
        const resHocSinh = await getHocSinh({ lopId: selectedClassId });
        if (!active) return;
        const rawHocSinhs = resHocSinh?.data?.data || [];
        const hocSinhs = sortStudentsByGivenName(rawHocSinhs);
        setStudents(hocSinhs);

        // Tải hạnh kiểm đã có theo đúng năm học
        const currentNamHocObj = namHocList.find((y) => y.tenNamHoc === selectedNamHoc);
        const namHocId = currentNamHocObj?.id;
        const targetHocKy = selectedSemester === "HK2" ? 2 : 1;

        let resHK = [];
        if (namHocId) {
          resHK = await getHanhKiemData({ lopId: selectedClassId, namHocId });
        }
        if (!active) return;

        const studentIdSet = new Set(hocSinhs.map((s) => s.id));

        // Lọc hạnh kiểm thuộc đúng học sinh, đúng năm học và đúng học kỳ (tuyệt đối không lấy nhầm năm khác)
        const filteredHk = (resHK || []).filter((r) => {
          const sid = r?.hocSinh?.id ?? r?.idHocSinh ?? r?.id_hocsinh;
          const matchStudent = studentIdSet.has(sid);
          const rHocKy = r?.hocKy ?? r?.hoc_ky;
          const matchHocKy = !targetHocKy || rHocKy === targetHocKy;
          const rNamHocId = r?.namHoc?.id ?? r?.idNamHoc ?? r?.id_namhoc;
          const rNamHocTen = r?.namHoc?.tenNamHoc ?? r?.namHoc?.ten_nam_hoc;
          const matchNamHoc = (namHocId && rNamHocId === namHocId) || (selectedNamHoc && rNamHocTen === selectedNamHoc);
          return matchStudent && matchHocKy && matchNamHoc;
        });

        // Tạo lookup: { studentId: { id, xepLoai, nhanXet, status, giaoVien } }
        const lookup = {};
        filteredHk.forEach((r) => {
          const sid = r?.hocSinh?.id ?? r?.idHocSinh ?? r?.id_hocsinh;
          if (sid) {
            lookup[sid] = {
              id: r.id ?? r.idHanhKiem ?? r.id_hanhkiem,
              xepLoai: r.xepLoai ?? r.xep_loai ?? null,
              nhanXet: r.nhanXet ?? r.nhan_xet ?? "",
              status: r.status ?? "DRAFT",
              giaoVien: r.giaoVien ?? r.giao_vien ?? null
            };
          }
        });

        setServerRecords(lookup);
      } catch (err) {
        setError("Lỗi tải dữ liệu hạnh kiểm từ máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [selectedClassId, selectedNamHoc, selectedSemester, namHocList]);

  // Wrapper gọi API lấy hạnh kiểm phòng lỗi
  const getHanhKiemData = async (params) => {
    try {
      const res = await getHanhKiem(params);
      return res?.data?.data || [];
    } catch {
      return [];
    }
  };

  // Reset page khi thay đổi bộ lọc
  useEffect(() => {
    setPage(1);
  }, [selectedClassId, selectedGrade, selectedSemester, selectedNamHoc]);

  // Phân trang danh sách học sinh
  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return students.slice(start, start + pageSize);
  }, [students, page, pageSize]);

  // Thống kê nhanh theo lớp
  const stats = useMemo(() => {
    let tot = 0;
    let kha = 0;
    let tb = 0;
    let yeu = 0;
    let chuaDanhGia = 0;
    let daDuyet = 0;
    let choDuyet = 0;

    students.forEach((student) => {
      const record = serverRecords[student.id];
      if (!record || !record.xepLoai) {
        chuaDanhGia += 1;
      } else {
        if (record.xepLoai === "TOT") tot += 1;
        else if (record.xepLoai === "KHA") kha += 1;
        else if (record.xepLoai === "TRUNG_BINH") tb += 1;
        else if (record.xepLoai === "YEU") yeu += 1;

        if (record.status === "APPROVED") {
          daDuyet += 1;
        } else {
          choDuyet += 1;
        }
      }
    });

    return { tot, kha, tb, yeu, chuaDanhGia, daDuyet, choDuyet, total: students.length };
  }, [students, serverRecords]);

  // Lưu danh sách hạnh kiểm
  const executeSave = async (payload, successMsg = "Cập nhật trạng thái duyệt thành công.") => {
    setSaving(true);
    try {
      const res = await saveAllHanhKiem(payload);
      if (res?.data?.success) {
        const saved = res.data.data || [];
        const newServer = { ...serverRecords };
        saved.forEach((r) => {
          const sid = r?.hocSinh?.id ?? r?.idHocSinh ?? r?.id_hocsinh;
          if (sid) {
            newServer[sid] = {
              id: r.id ?? r.idHanhKiem ?? r.id_hanhkiem,
              xepLoai: r.xepLoai ?? r.xep_loai ?? null,
              nhanXet: r.nhanXet ?? r.nhan_xet ?? "",
              status: r.status ?? "DRAFT",
              giaoVien: r.giaoVien ?? r.giao_vien ?? null
            };
          }
        });
        setServerRecords(newServer);
        notifySuccess(successMsg);
      } else {
        notifyError(res?.data?.message || "Thao tác thất bại.");
      }
    } catch (err) {
      notifyError("Đã xảy ra lỗi khi gửi yêu cầu lên máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  // Duyệt và khóa hạnh kiểm tất cả học sinh trong lớp hiện tại
  const handleApproveAll = async () => {
    if (students.length === 0) return;
    const currentNamHocObj = namHocList.find((y) => y.tenNamHoc === selectedNamHoc);
    const targetHocKy = selectedSemester === "HK2" ? 2 : 1;

    const payload = students
      .filter((s) => serverRecords[s.id]?.xepLoai) // Chỉ duyệt những em đã có đánh giá
      .map((s) => {
        const server = serverRecords[s.id];
        return {
          id: server?.id || null,
          hocSinh: { id: s.id },
          namHoc: { id: currentNamHocObj?.id },
          hocKy: targetHocKy,
          xepLoai: server?.xepLoai || "TOT",
          nhanXet: server?.nhanXet || "",
          giaoVien: server?.giaoVien ? { id: server.giaoVien.id } : null,
          status: "APPROVED"
        };
      });

    if (payload.length === 0) {
      notifyError("Chưa có học sinh nào được GVCN đánh giá hạnh kiểm để duyệt.");
      return;
    }

    await executeSave(payload, "Đã phê duyệt và khóa toàn bộ hạnh kiểm của lớp.");
  };

  // Mở khóa tất cả học sinh trong lớp hiện tại
  const handleUnlockAll = async () => {
    if (students.length === 0) return;
    const currentNamHocObj = namHocList.find((y) => y.tenNamHoc === selectedNamHoc);
    const targetHocKy = selectedSemester === "HK2" ? 2 : 1;

    const payload = students
      .filter((s) => serverRecords[s.id]?.xepLoai)
      .map((s) => {
        const server = serverRecords[s.id];
        return {
          id: server?.id || null,
          hocSinh: { id: s.id },
          namHoc: { id: currentNamHocObj?.id },
          hocKy: targetHocKy,
          xepLoai: server?.xepLoai || "TOT",
          nhanXet: server?.nhanXet || "",
          giaoVien: server?.giaoVien ? { id: server.giaoVien.id } : null,
          status: "DRAFT"
        };
      });

    await executeSave(payload, "Đã mở khóa đánh giá hạnh kiểm cho lớp.");
  };

  // Phê duyệt hoặc Mở khóa từng học sinh
  const toggleApproveSingle = async (studentId) => {
    const currentNamHocObj = namHocList.find((y) => y.tenNamHoc === selectedNamHoc);
    const targetHocKy = selectedSemester === "HK2" ? 2 : 1;
    const server = serverRecords[studentId];
    if (!server || !server.xepLoai) {
      notifyError("Học sinh này chưa có đánh giá hạnh kiểm từ GVCN.");
      return;
    }
    const isApproved = server?.status === "APPROVED";
    const nextStatus = isApproved ? "DRAFT" : "APPROVED";

    const payload = [
      {
        id: server?.id || null,
        hocSinh: { id: studentId },
        namHoc: { id: currentNamHocObj?.id },
        hocKy: targetHocKy,
        xepLoai: server?.xepLoai || "TOT",
        nhanXet: server?.nhanXet || "",
        giaoVien: server?.giaoVien ? { id: server.giaoVien.id } : null,
        status: nextStatus
      }
    ];

    await executeSave(
      payload,
      nextStatus === "APPROVED" ? "Đã duyệt hạnh kiểm học sinh." : "Đã mở khóa đánh giá học sinh."
    );
  };

  const getStatusBadge = (record) => {
    if (!record || !record.xepLoai) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Chưa gửi duyệt
        </span>
      );
    }
    if (record.status === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Đã duyệt & Khóa
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Chờ duyệt
      </span>
    );
  };

  const getXepLoaiBadge = (xepLoai) => {
    switch (xepLoai) {
      case "TOT":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Tốt
          </span>
        );
      case "KHA":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Khá
          </span>
        );
      case "TRUNG_BINH":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Trung bình
          </span>
        );
      case "YEU":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Yếu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200">
            Chưa đánh giá
          </span>
        );
    }
  };

  return (
    <div className="edu-card-container">
      <PageHeader
        title="Duyệt Hạnh Kiểm Học Sinh"
        subtitle="Xem xét nhận xét và xếp loại rèn luyện từ Giáo viên chủ nhiệm để kiểm tra, phê duyệt hoặc mở khóa."
        icon="verified"
      />

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-6">
        {/* Khối */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khối</span>
          <select
            className="attendance-input w-full"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="10">Khối 10</option>
            <option value="11">Khối 11</option>
            <option value="12">Khối 12</option>
          </select>
        </div>

        {/* Lớp */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lớp học</span>
          <select
            className="attendance-input w-full"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={filteredClasses.length === 0}
          >
            {filteredClasses.length === 0 && <option value="">Không có lớp</option>}
            {filteredClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tenLop}
              </option>
            ))}
          </select>
        </div>

        {/* Năm học */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Năm học</span>
          <select
            className="attendance-input w-full"
            value={selectedNamHoc}
            onChange={(e) => setSelectedNamHoc(e.target.value)}
          >
            {namHocList.map((y) => (
              <option key={y.id} value={y.tenNamHoc}>
                {y.tenNamHoc}
              </option>
            ))}
          </select>
        </div>

        {/* Học kỳ */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Học kỳ</span>
          <select
            className="attendance-input w-full"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="HK1">Học kỳ I</option>
            <option value="HK2">Học kỳ II</option>
          </select>
        </div>

        {/* Hành động bulk */}
        <div className="ml-auto flex gap-3 self-end">
          {stats.daDuyet > 0 && (
            <button
              className="btn btn-outline flex items-center gap-2 py-2.5 px-4 font-semibold text-sm rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
              disabled={saving || loading || students.length === 0}
              onClick={handleUnlockAll}
            >
              <MaterialIcon icon="lock_open" />
              Mở khóa cả lớp
            </button>
          )}

          <button
            className="btn btn-emerald flex items-center gap-2 py-2.5 px-4 font-semibold text-sm rounded-xl transition duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving || loading || students.length === 0 || stats.chuaDanhGia === stats.total}
            onClick={handleApproveAll}
            title={stats.chuaDanhGia === stats.total ? "Chưa có đánh giá hạnh kiểm để duyệt" : ""}
          >
            <MaterialIcon icon="done_all" />
            Duyệt tất cả lớp
          </button>
        </div>
      </div>

      {/* Thông báo năm học chưa có đợt đánh giá */}
      {!loading && students.length > 0 && stats.chuaDanhGia === stats.total && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-blue-50/90 border border-blue-200 text-blue-800 text-sm">
          <MaterialIcon icon="info" className="text-blue-500" />
          <span>
            Năm học <strong>{selectedNamHoc}</strong> ({selectedSemester === "HK2" ? "Học kỳ II" : "Học kỳ I"}): Chưa đến đợt đánh giá hoặc Giáo viên chủ nhiệm chưa gửi bảng đánh giá hạnh kiểm cho lớp này.
          </span>
        </div>
      )}

      {/* Thanh thống kê nhanh */}
      {!loading && students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
            <span className="text-xs font-medium text-slate-400">Sĩ số lớp</span>
            <span className="text-xl font-bold text-slate-700 mt-1">{stats.total} HS</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm flex flex-col">
            <span className="text-xs font-medium text-emerald-600">Loại Tốt</span>
            <span className="text-xl font-bold text-emerald-700 mt-1">{stats.tot}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm flex flex-col">
            <span className="text-xs font-medium text-blue-600">Loại Khá</span>
            <span className="text-xl font-bold text-blue-700 mt-1">{stats.kha}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-sm flex flex-col">
            <span className="text-xs font-medium text-amber-600">Trung bình</span>
            <span className="text-xl font-bold text-amber-700 mt-1">{stats.tb}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-sm flex flex-col">
            <span className="text-xs font-medium text-rose-600">Loại Yếu</span>
            <span className="text-xl font-bold text-rose-700 mt-1">{stats.yeu}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
            <span className="text-xs font-medium text-slate-400">Đã duyệt</span>
            <span className="text-xl font-bold text-emerald-600 mt-1">
              {stats.daDuyet}/{stats.total}
            </span>
          </div>
        </div>
      )}

      {/* Trạng thái lỗi */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <MaterialIcon icon="error_outline" />
          <span>{error}</span>
        </div>
      )}

      {/* Bảng hạnh kiểm */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="attendance-row skeleton-container" style={{ gridTemplateColumns: "220px 160px 1.5fr 150px 130px" }}>
              <div className="skeleton h-8 rounded-lg w-3/4" />
              <div className="skeleton h-8 rounded-lg w-1/2" />
              <div className="skeleton h-8 rounded-lg" />
              <div className="skeleton h-8 rounded-lg w-2/3" />
              <div className="skeleton h-8 rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
            <MaterialIcon icon="people_outline" size="32px" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">Lớp học trống</h3>
          <p className="text-sm text-slate-400 max-w-sm">Không tìm thấy học sinh nào thuộc lớp học này.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="attendance-table">
            {/* Header */}
            <div className="attendance-row attendance-head" style={{ gridTemplateColumns: "220px 160px 1.5fr 150px 130px", borderBottom: "2px solid #f1f5f9" }}>
              <div className="font-bold text-slate-600">Họ và Tên</div>
              <div className="font-bold text-slate-600">Xếp loại (GVCN)</div>
              <div className="font-bold text-slate-600">Nhận xét của GVCN</div>
              <div className="font-bold text-slate-600 text-center">Trạng thái</div>
              <div className="font-bold text-slate-600 text-center">Phê duyệt</div>
            </div>

            {/* List */}
            <div className="attendance-body">
              {paginatedStudents.map((student) => {
                const record = serverRecords[student.id] || {
                  xepLoai: null,
                  nhanXet: "",
                  status: "DRAFT"
                };

                return (
                  <div
                    className="attendance-row items-center hover:bg-slate-50/60 transition-colors"
                    style={{ gridTemplateColumns: "220px 160px 1.5fr 150px 130px", borderBottom: "1px solid #f1f5f9" }}
                    key={student.id}
                  >
                    {/* Tên */}
                    <div className="table-main">
                      <div className="table-title font-semibold text-slate-700">{student.hoTen}</div>
                      <div className="table-meta text-xs text-slate-400">
                        {student.maHocSinh ? `Mã: ${student.maHocSinh} · ` : ""}
                        {getStudentClass(student)?.tenLop || "--"}
                      </div>
                    </div>

                    {/* Xếp loại của GVCN */}
                    <div>
                      {getXepLoaiBadge(record.xepLoai)}
                    </div>

                    {/* Nhận xét của GVCN (Hiển thị để Admin duyệt) */}
                    <div className="pr-4 py-1">
                      {record.nhanXet && record.nhanXet.trim() ? (
                        <div className="text-sm text-slate-700 bg-slate-50/80 border border-slate-200/70 rounded-xl px-3.5 py-2 leading-relaxed shadow-xs">
                          {record.nhanXet}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic flex items-center gap-1.5 px-2">
                          <MaterialIcon icon="chat_bubble_outline" size="14px" className="text-slate-300" />
                          Chưa có nhận xét từ GVCN
                        </div>
                      )}
                    </div>

                    {/* Trạng thái duyệt */}
                    <div className="flex justify-center">
                      {getStatusBadge(record)}
                    </div>

                    {/* Nút phê duyệt */}
                    <div className="flex justify-center">
                      <button
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition duration-200 ${
                          !record?.xepLoai
                            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                            : record.status === "APPROVED"
                            ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 cursor-pointer"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                        }`}
                        disabled={saving || !record?.xepLoai}
                        onClick={() => record?.xepLoai && toggleApproveSingle(student.id)}
                        title={!record?.xepLoai ? "Chưa có đánh giá từ GVCN" : ""}
                      >
                        <MaterialIcon icon={record.status === "APPROVED" ? "lock_open" : "check"} size="16px" />
                        {record.status === "APPROVED" ? "Mở khóa" : "Duyệt"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phân trang */}
          {students.length > 0 && (
            <div className="mt-auto border-t border-slate-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={students.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
                pageSizeOptions={[10, 15, 20, 50]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
