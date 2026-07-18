import { useEffect, useState, useMemo } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getHanhKiem, saveAllHanhKiem } from "../../../api/hanhkiemApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";
import { getStudentClass } from "../../../utils/helpers.js";

export default function AdminHanhKiemPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [namHocList, setNamHocList] = useState([]);

  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("HK1");
  const [selectedNamHoc, setSelectedNamHoc] = useState("");

  const [serverRecords, setServerRecords] = useState({});
  const [draftRecords, setDraftRecords] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setNamHocList(rawNamHoc);

        // Chọn năm học hiện tại
        const currentYear = rawNamHoc.find((y) => y.trangThai === "DANG_HOAT_DONG") || rawNamHoc[0];
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

  // Lọc danh sách lớp theo khối
  const filteredClasses = useMemo(() => {
    if (selectedGrade === "all") return classes;
    const gradeNum = parseInt(selectedGrade, 10);
    return classes.filter((c) => c.khoi === gradeNum);
  }, [classes, selectedGrade]);

  // Reset lớp đã chọn nếu không nằm trong khối lọc
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
        setIsDirty(false);

        // Tải học sinh trong lớp
        const resHocSinh = await getHocSinh({ lopId: selectedClassId });
        if (!active) return;
        const hocSinhs = resHocSinh?.data?.data || [];
        setStudents(hocSinhs);

        // Tải hạnh kiểm đã có
        const hkParams = {
          namHoc: selectedNamHoc,
          hocKy: selectedSemester === "HK2" ? 2 : 1
        };
        const resHK = await getHanhKiemData(hkParams);
        if (!active) return;

        // Lọc hạnh kiểm thuộc lớp hiện tại
        const filteredHk = resHK.filter((r) => r?.hocSinh?.lop?.id === Number(selectedClassId));

        // Tạo lookup: { studentId: { id, xepLoai, nhanXet, status } }
        const lookup = {};
        filteredHk.forEach((r) => {
          const sid = r?.hocSinh?.id;
          if (sid) {
            lookup[sid] = {
              id: r.id,
              xepLoai: r.xepLoai || "TOT",
              nhanXet: r.nhanXet || "",
              status: r.status || "DRAFT"
            };
          }
        });

        setServerRecords(lookup);
        // Khởi tạo draft từ dữ liệu server
        const initialDraft = {};
        hocSinhs.forEach((student) => {
          initialDraft[student.id] = lookup[student.id] || {
            xepLoai: "TOT",
            nhanXet: "",
            status: "DRAFT"
          };
        });
        setDraftRecords(initialDraft);
      } catch (err) {
        setError("Lỗi tải dữ liệu hạnh kiểm từ máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [selectedClassId, selectedNamHoc, selectedSemester]);

  // Wrapper gọi API lấy hạnh kiểm phòng lỗi
  const getHanhKiemData = async (params) => {
    try {
      const res = await getHanhKiem(params);
      return res?.data?.data || [];
    } catch {
      return [];
    }
  };

  // Cập nhật giá trị nháp
  const updateRecord = (studentId, fields) => {
    setDraftRecords((prev) => {
      const updated = {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          ...fields
        }
      };
      setIsDirty(true);
      return updated;
    });
  };

  // Lưu tất cả thay đổi nháp
  const handleSave = async (customPayload = null) => {
    if (!selectedClassId || !selectedNamHoc) return;
    setSaving(true);
    try {
      const payload = customPayload || students.map((s) => {
        const draft = draftRecords[s.id] || { xepLoai: "TOT", nhanXet: "", status: "DRAFT" };
        return {
          id: draft.id || null,
          hocSinh: { id: s.id },
          namHoc: { tenNamHoc: selectedNamHoc },
          hocKy: selectedSemester === "HK2" ? 2 : 1,
          xepLoai: draft.xepLoai,
          nhanXet: draft.nhanXet,
          status: draft.status
        };
      });

      const res = await saveAllHanhKiem(payload);
      if (res?.data?.success) {
        const saved = res.data.data || [];
        const newServer = {};
        saved.forEach((r) => {
          const sid = r?.hocSinh?.id;
          if (sid) {
            newServer[sid] = {
              id: r.id,
              xepLoai: r.xepLoai || "TOT",
              nhanXet: r.nhanXet || "",
              status: r.status || "DRAFT"
            };
          }
        });
        setServerRecords(newServer);
        // Đồng bộ lại draft
        setDraftRecords((prev) => {
          const syncedDraft = { ...prev };
          Object.keys(newServer).forEach((sid) => {
            syncedDraft[sid] = { ...newServer[sid] };
          });
          return syncedDraft;
        });
        setIsDirty(false);
        notifySuccess("Đã lưu đánh giá hạnh kiểm thành công.");
      } else {
        notifyError(res?.data?.message || "Lưu thất bại.");
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
    
    // Tạo payload với tất cả status = APPROVED
    const payload = students.map((s) => {
      const draft = draftRecords[s.id] || { xepLoai: "TOT", nhanXet: "", status: "DRAFT" };
      return {
        id: draft.id || null,
        hocSinh: { id: s.id },
        namHoc: { tenNamHoc: selectedNamHoc },
        hocKy: selectedSemester === "HK2" ? 2 : 1,
        xepLoai: draft.xepLoai,
        nhanXet: draft.nhanXet,
        status: "APPROVED" // Ép buộc APPROVED
      };
    });

    await handleSave(payload);
  };

  // Phê duyệt hoặc Mở khóa cá nhân
  const toggleApproveSingle = (studentId) => {
    const draft = draftRecords[studentId] || { xepLoai: "TOT", nhanXet: "", status: "DRAFT" };
    const nextStatus = draft.status === "APPROVED" ? "DRAFT" : "APPROVED";
    updateRecord(studentId, { status: nextStatus });
  };

  const getStatusBadge = (status) => {
    if (status === "APPROVED") {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Đã duyệt & Khóa
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Bản nháp
      </span>
    );
  };

  return (
    <div className="edu-card-container">
      <PageHeader
        title="Duyệt Hạnh Kiểm Học Sinh"
        subtitle="Quản trị viên kiểm tra, mở khóa hoặc phê duyệt đóng băng kết quả hạnh kiểm từ giáo viên chủ nhiệm."
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
          <button
            className="btn btn-emerald flex items-center gap-2 py-2.5 px-4 font-semibold text-sm rounded-xl transition duration-200"
            disabled={saving || loading || students.length === 0}
            onClick={handleApproveAll}
          >
            <MaterialIcon icon="done_all" />
            Duyệt tất cả lớp
          </button>

          <button
            className={`btn ${isDirty ? "btn-primary" : "btn-disabled"} flex items-center gap-2 py-2.5 px-4 font-semibold text-sm rounded-xl transition duration-200`}
            disabled={saving || loading || !isDirty}
            onClick={() => handleSave()}
          >
            <MaterialIcon icon="save" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

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
            <div key={n} className="attendance-row skeleton-container" style={{ gridTemplateColumns: "220px 180px 1.4fr 160px 140px" }}>
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="attendance-table">
            {/* Header */}
            <div className="attendance-row attendance-head" style={{ gridTemplateColumns: "220px 180px 1.4fr 160px 140px", borderBottom: "2px solid #f1f5f9" }}>
              <div className="font-bold text-slate-600">Họ và Tên</div>
              <div className="font-bold text-slate-600">Xếp loại</div>
              <div className="font-bold text-slate-600">Nhận xét</div>
              <div className="font-bold text-slate-600 text-center">Trạng thái</div>
              <div className="font-bold text-slate-600 text-center">Phê duyệt</div>
            </div>

            {/* List */}
            <div className="attendance-body">
              {students.map((student) => {
                const record = draftRecords[student.id] || {
                  xepLoai: "TOT",
                  nhanXet: "",
                  status: "DRAFT"
                };

                return (
                  <div
                    className="attendance-row items-center"
                    style={{ gridTemplateColumns: "220px 180px 1.4fr 160px 140px", borderBottom: "1px solid #f1f5f9" }}
                    key={student.id}
                  >
                    {/* Tên */}
                    <div className="table-main">
                      <div className="table-title font-semibold text-slate-700">{student.hoTen}</div>
                      <div className="table-meta text-xs text-slate-400">
                        {getStudentClass(student)?.tenLop || "--"}
                      </div>
                    </div>

                    {/* Xếp loại */}
                    <div>
                      <select
                        className="attendance-input w-full"
                        value={record.xepLoai}
                        onChange={(event) =>
                          updateRecord(student.id, { xepLoai: event.target.value })
                        }
                      >
                        <option value="TOT">Tốt</option>
                        <option value="KHA">Khá</option>
                        <option value="TRUNG_BINH">Trung bình</option>
                        <option value="YEU">Yếu</option>
                      </select>
                    </div>

                    {/* Nhận xét */}
                    <div>
                      <input
                        className="attendance-note w-full"
                        value={record.nhanXet}
                        onChange={(event) =>
                          updateRecord(student.id, { nhanXet: event.target.value })
                        }
                        placeholder="Nhập nhận xét của admin..."
                      />
                    </div>

                    {/* Trạng thái duyệt */}
                    <div className="flex justify-center">
                      {getStatusBadge(record.status)}
                    </div>

                    {/* Nút phê duyệt */}
                    <div className="flex justify-center">
                      <button
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition duration-200 ${
                          record.status === "APPROVED"
                            ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        }`}
                        onClick={() => toggleApproveSingle(student.id)}
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
        </div>
      )}
    </div>
  );
}
