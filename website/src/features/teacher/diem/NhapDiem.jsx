import { useEffect, useMemo, useState, useRef, memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDragScroll } from "../../../hooks/useDragScroll.js";
import { getAdminConfig } from "../../../api/adminConfigApi.js";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getGiaoVien, getCurrentGiaoVien } from "../../../api/giaovienApi.js";
import { getPhanCongDay } from "../../../api/phancongDayApi.js";
import { getDiem, saveAllDiem } from "../../../api/diemApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { getStudentClass, getStudentClassId, sortStudentsByGivenName } from "../../../utils/helpers.js";
import { isScoreColumnLocked, readScoreLocks } from "../../../utils/scoreLocks.js";
import { getCurrentUsernameFromToken, findTeacherByUsername } from "../../../utils/teacherProfile.js";
import {
  getPolicyBySubjectName,
  getRecordKey,
  toScore,
  createEmptySemester,
  calcSemesterAverage,
  calcYearAverage,
  getOverallLearningLevel,
  getLearningLevelLabel,
  getSingleSubjectLevel
} from "../../../utils/scorePolicy.js";
import { normalizeSubjectText } from "../../../utils/normalizeText.js";
import TeacherFilter from "../../../components/common/TeacherFilter.jsx";
import Pagination from "../../../components/common/Pagination.jsx";
import { useTeacherFilters } from "../../../hooks/useTeacherFilters.js";

const STORAGE_KEY = "teacher_subject_scores_v2";

const convertDiemRowsToDraft = (diemRows) => {
  const records = {};
  const ids = {};

  diemRows.forEach((row) => {
    const studentId = row?.hocSinh?.id ?? row?.hocSinhId;
    const subjectId = row?.monHoc?.id ?? row?.monHocId;
    if (!studentId || !subjectId) return;

    const key = getRecordKey(studentId, subjectId);
    const semester = row.hocKy === 1 ? "HK1" : "HK2";

    if (!records[key]) {
      records[key] = { HK1: null, HK2: null };
    }
    if (!records[key][semester]) {
      records[key][semester] = { tx: ["", "", "", ""], gk: "", ck: "", nhanXet: "DAT" };
    }

    const sem = records[key][semester];
    const val = row.giaTriDiem !== null && row.giaTriDiem !== undefined ? String(row.giaTriDiem) : "";

    if (row.loaiDiem === "TX" && row.soThuTu >= 1 && row.soThuTu <= 4) {
      sem.tx[row.soThuTu - 1] = val;
    } else if (row.loaiDiem === "GK") {
      sem.gk = val;
    } else if (row.loaiDiem === "CK") {
      sem.ck = val;
    }

    if (row.nhanXet) {
      sem.nhanXet = row.nhanXet;
    }

    // Track DB IDs for update
    const idKey = `${key}_${row.loaiDiem}_${row.soThuTu || 0}_${semester}`;
    if (row.id) {
      ids[idKey] = row.id;
    }
  });

  // Fill null semesters with empty
  Object.keys(records).forEach((key) => {
    if (!records[key].HK1) records[key].HK1 = { tx: ["", "", "", ""], gk: "", ck: "", nhanXet: "DAT" };
    if (!records[key].HK2) records[key].HK2 = { tx: ["", "", "", ""], gk: "", ck: "", nhanXet: "DAT" };
  });

  return { records, ids };
};

const StudentScoreRow = memo(({ 
  student, 
  selectedSubject, 
  selectedSemester, 
  selectedPolicy, 
  rawRecord, 
  rowBg, 
  isColumnLocked, 
  updateRecord 
}) => {
  const policy = selectedPolicy;
  
  const mergeSemester = (empty, existing) => {
    if (!existing) return empty;
    const mergedTx = [...empty.tx];
    (existing.tx || []).forEach((val, i) => {
      if (i < mergedTx.length) mergedTx[i] = val;
    });
    return {
      tx: mergedTx,
      gk: existing.gk ?? empty.gk,
      ck: existing.ck ?? empty.ck,
      nhanXet: existing.nhanXet ?? empty.nhanXet
    };
  };

  const current = rawRecord || {};
  const fullRecord = {
      HK1: mergeSemester(createEmptySemester(policy.txCount), current.HK1),
      HK2: mergeSemester(createEmptySemester(policy.txCount), current.HK2)
  };
  
  const semData = fullRecord[selectedSemester];
  const hk1Avg = calcSemesterAverage(fullRecord.HK1);
  const hk2Avg = calcSemesterAverage(fullRecord.HK2);
  const yearAvg = calcYearAverage(hk1Avg, hk2Avg);

  if (selectedPolicy.mode === "COMMENT") {
    const finalComment = fullRecord.HK1.nhanXet === "DAT" && fullRecord.HK2.nhanXet === "DAT" ? "DAT" : "CHUA_DAT";
    return (
      <tr className={`hover:bg-blue-50/50 transition-colors border-b border-slate-100 last:border-0 ${rowBg}`}>
        <td className={`px-4 py-3 sticky left-0 ${rowBg} border-r border-slate-200 z-10 hover:bg-inherit`}>
          <div className="font-bold text-[14px] text-slate-800">{student.hoTen}</div>
          <div className="text-[12px] text-slate-500 font-medium mt-0.5">{getStudentClass(student)?.tenLop || "--"}</div>
        </td>
        <td className="px-4 py-3 text-center">
          <select
            className="h-10 w-full max-w-[140px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 disabled:opacity-50 mx-auto"
            value={semData.nhanXet}
            disabled={isColumnLocked("comment")}
            onChange={(event) => updateRecord(student.id, selectedSubject.id, selectedSemester, { nhanXet: event.target.value }, selectedSubject.tenMon)}
          >
            <option value="DAT">Đạt</option>
            <option value="CHUA_DAT">Chưa đạt</option>
          </select>
        </td>
        <td className="px-4 py-3 text-center text-[14px] font-semibold text-slate-700">
          {finalComment === "DAT" ? "Đạt" : "Chưa đạt"}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-[12px] font-bold">
            {finalComment === "DAT" ? "Đạt" : "Chưa đạt"}
          </span>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`hover:bg-blue-50/50 transition-colors border-b border-slate-100 last:border-0 ${rowBg}`}>
      <td className={`px-4 py-3 sticky left-0 ${rowBg} border-r border-slate-200 z-10`}>
        <div className="font-bold text-[14px] text-slate-800">{student.hoTen}</div>
        <div className="text-[12px] text-slate-500 font-medium mt-0.5">{getStudentClass(student)?.tenLop || "--"}</div>
      </td>

      {Array.from({ length: selectedPolicy.txCount }).map((_, index) => (
        <td key={`tx-${index}`} className="px-2 py-3 text-center">
          <input
            className="h-10 w-full max-w-[64px] rounded-[8px] border border-slate-200 bg-white px-2 text-center text-[14px] font-semibold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 disabled:opacity-50 disabled:bg-slate-50 mx-auto"
            type="number" min="0" max="10" step="0.1"
            value={semData.tx[index] ?? ""}
            disabled={isColumnLocked(`tx-${index}`)}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") {
                const nextTx = [...(semData.tx || [])];
                nextTx[index] = "";
                updateRecord(student.id, selectedSubject.id, selectedSemester, { tx: nextTx }, selectedSubject.tenMon);
                return;
              }
              const n = Number(raw);
              if (Number.isNaN(n) || n < 0 || n > 10) {
                notifyError("Điểm phải là số trong khoảng 0 - 10");
                return;
              }
              const nextTx = [...(semData.tx || [])];
              nextTx[index] = raw;
              updateRecord(student.id, selectedSubject.id, selectedSemester, { tx: nextTx }, selectedSubject.tenMon);
            }}
          />
        </td>
      ))}

      <td className="px-2 py-3 text-center border-l border-slate-200">
        <input
          className="h-10 w-full max-w-[64px] rounded-[8px] border border-slate-200 bg-white px-2 text-center text-[14px] font-semibold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 disabled:opacity-50 disabled:bg-slate-50 mx-auto"
          type="number" min="0" max="10" step="0.1"
          value={semData.gk}
          disabled={isColumnLocked("gk")}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === "") {
              updateRecord(student.id, selectedSubject.id, selectedSemester, { gk: "" }, selectedSubject.tenMon);
              return;
            }
            const n = Number(raw);
            if (Number.isNaN(n) || n < 0 || n > 10) {
              notifyError("Điểm phải là số trong khoảng 0 - 10");
              return;
            }
            updateRecord(student.id, selectedSubject.id, selectedSemester, { gk: raw }, selectedSubject.tenMon);
          }}
        />
      </td>

      <td className="px-2 py-3 text-center">
        <input
          className="h-10 w-full max-w-[64px] rounded-[8px] border border-slate-200 bg-white px-2 text-center text-[14px] font-semibold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 disabled:opacity-50 disabled:bg-slate-50 mx-auto"
          type="number" min="0" max="10" step="0.1"
          value={semData.ck}
          disabled={isColumnLocked("ck")}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === "") {
              updateRecord(student.id, selectedSubject.id, selectedSemester, { ck: "" }, selectedSubject.tenMon);
              return;
            }
            const n = Number(raw);
            if (Number.isNaN(n) || n < 0 || n > 10) {
              notifyError("Điểm phải là số trong khoảng 0 - 10");
              return;
            }
            updateRecord(student.id, selectedSubject.id, selectedSemester, { ck: raw }, selectedSubject.tenMon);
          }}
        />
      </td>

      <td className="px-3 py-3 text-center text-[14px] font-bold text-blue-700 border-l border-slate-200">
        {calcSemesterAverage(semData) ?? "--"}
      </td>
      <td className="px-3 py-3 text-center text-[14px] font-bold text-emerald-700">
        {yearAvg ?? "--"}
      </td>

      <td className="px-3 py-3 text-center border-l border-slate-200">
        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-[12px] font-bold whitespace-nowrap">
          {getSingleSubjectLevel(calcSemesterAverage(semData))}
        </span>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.rawRecord === nextProps.rawRecord &&
         prevProps.selectedSemester === nextProps.selectedSemester &&
         prevProps.rowBg === nextProps.rowBg &&
         prevProps.selectedPolicy === nextProps.selectedPolicy &&
         prevProps.selectedSubject?.id === nextProps.selectedSubject?.id;
});

export default function NhapDiem() {
  const filters = useTeacherFilters({ teachOnly: true });
  const {
    loading: filterLoading,
    error: filterError,
    currentTeacher,
    selectedNamHoc,
    selectedSemester,
    selectedGrade,
    selectedClassId: selectedClass,
    selectedSubjectObj: selectedSubject,
    selectedSubjectId,
    setSelectedSubjectId,
    allStudents: students,
    filteredClasses,
    allowedSubjects,
    allSubjects,
    isHomeroomTeacherOfSelected,
    isSelectedSubjectTaughtByMe,
    phanCongData,
    selectedClassObj
  } = filters;

  const [draftRecords, setDraftRecords] = useState({});
  const [savedRecordIds, setSavedRecordIds] = useState({});
  const [scoreLocks, setScoreLocks] = useState(() => readScoreLocks());
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const dragScroll = useDragScroll();

  // Auto-scroll active subject tab into view
  useEffect(() => {
    if (!selectedSubjectId || !dragScroll.ref.current) return;
    const activeBtn = dragScroll.ref.current.querySelector(`[data-subject-id="${selectedSubjectId}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    let active = true;
    const fetchLocks = async () => {
      try {
        const res = await getAdminConfig("score_locks");
        if (!active) return;
        const val = res?.data?.data?.configValue;
        if (val) {
          const parsed = JSON.parse(val);
          setScoreLocks(parsed);
          window.localStorage.setItem("admin_score_locks_v1", val);
        }
      } catch (err) {
        // ignore config not found
      }
    };
    fetchLocks();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedNamHoc || !currentTeacher?.id || !selectedClass) return;
    let active = true;

    const reloadScores = async () => {
      try {
        setLoading(true);
        // Fetch scores for this specific class and year
        // We use lopId to get all scores for the class, so GVCN can view them.
        const [hk1Res, hk2Res] = await Promise.all([
          getDiem({ lopId: selectedClass, hocKy: 1, namHoc: selectedNamHoc }),
          getDiem({ lopId: selectedClass, hocKy: 2, namHoc: selectedNamHoc })
        ]);
        if (!active) return;

        const allDiem = [
          ...(hk1Res?.data?.data || []),
          ...(hk2Res?.data?.data || [])
        ];
        const { records, ids } = convertDiemRowsToDraft(allDiem);
        setSavedRecordIds(ids);
        setDraftRecords(records);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };

    reloadScores();
    return () => { active = false; };
  }, [selectedNamHoc, currentTeacher?.id, selectedClass]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!isDirty) return;
    const timeoutId = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftRecords));
        setLastSavedAt("Auto-saved lúc " + new Date().toLocaleString("vi-VN"));
      } catch (e) {
        // ignore
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [draftRecords, isDirty]);

  const selectedPolicy = useMemo(
    () => getPolicyBySubjectName(selectedSubject?.tenMon || ""),
    [selectedSubject]
  );

  const lockedColumns = useMemo(() => {
    if (!selectedSubject?.id) return [];

    if (selectedPolicy.mode === "COMMENT") {
      return isScoreColumnLocked(scoreLocks, selectedSubject.id, selectedSemester, "comment")
        ? ["Đánh giá"]
        : [];
    }

    const columns = [];
    Array.from({ length: selectedPolicy.txCount }).forEach((_, index) => {
      if (isScoreColumnLocked(scoreLocks, selectedSubject.id, selectedSemester, `tx-${index}`)) {
        columns.push(`TX ${index + 1}`);
      }
    });
    if (isScoreColumnLocked(scoreLocks, selectedSubject.id, selectedSemester, "gk")) {
      columns.push("Giữa kỳ");
    }
    if (isScoreColumnLocked(scoreLocks, selectedSubject.id, selectedSemester, "ck")) {
      columns.push("Cuối kỳ");
    }
    return columns;
  }, [scoreLocks, selectedSemester, selectedPolicy.mode, selectedPolicy.txCount, selectedSubject?.id]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    let result = students.filter(
      (student) => student.trangThai === 1 && String(getStudentClassId(student) || "") === String(selectedClass)
    );
    result = sortStudentsByGivenName(result);
    return result;
  }, [selectedClass, students]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedGrade, selectedSubjectId, selectedSemester, selectedNamHoc]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const getFullRecord = (studentId, subject) => {
    const policy = getPolicyBySubjectName(subject.tenMon);
    const key = getRecordKey(studentId, subject.id);
    const current = draftRecords[key] || {};

    const mergeSemester = (empty, existing) => {
      if (!existing) return empty;
      const mergedTx = [...empty.tx];
      (existing.tx || []).forEach((val, i) => {
        if (i < mergedTx.length) mergedTx[i] = val;
      });
      return {
        tx: mergedTx,
        gk: existing.gk ?? empty.gk,
        ck: existing.ck ?? empty.ck,
        nhanXet: existing.nhanXet ?? empty.nhanXet
      };
    };

    return {
      HK1: mergeSemester(createEmptySemester(policy.txCount), current.HK1),
      HK2: mergeSemester(createEmptySemester(policy.txCount), current.HK2)
    };
  };

  const updateRecord = useCallback((studentId, subjectId, semester, patch, tenMon) => {
    const policy = getPolicyBySubjectName(tenMon);
    const key = getRecordKey(studentId, subjectId);

    setDraftRecords((prev) => {
      const current = prev[key] || {
        HK1: createEmptySemester(policy.txCount),
        HK2: createEmptySemester(policy.txCount)
      };

      const mergedSemester = { ...current[semester], ...patch };

      return {
        ...prev,
        [key]: {
          ...current,
          [semester]: mergedSemester
        }
      };
    });

    setSaveMessage("");
    setIsDirty(true);
  }, []);

  const isColumnLocked = useCallback((column) => {
    if (!isSelectedSubjectTaughtByMe) return true;
    if (!selectedSubject?.id) return false;
    return isScoreColumnLocked(scoreLocks, selectedSubject.id, selectedSemester, column);
  }, [isSelectedSubjectTaughtByMe, selectedSubject?.id, scoreLocks, selectedSemester]);

  const handleSave = async () => {
    if (!currentTeacher?.id || !selectedNamHoc) {
      setError("Không xác định được giáo viên hoặc năm học. Không thể lưu.");
      return;
    }

    setSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const diemRows = [];

      Object.entries(draftRecords).forEach(([key, record]) => {
        const [studentIdStr, subjectIdStr] = key.split("_");
        const studentId = Number(studentIdStr);
        const subjectId = Number(subjectIdStr);
        if (!studentId || !subjectId) return;

        // Find phanCongDay for this teacher+subject+class
        const student = students.find((s) => Number(s.id) === studentId);
        const classId = student ? getStudentClassId(student) : null;

        // Chỉ lưu học kỳ đang chọn để giảm tải
        const semestersToSave = [selectedSemester];
        semestersToSave.forEach((semester) => {
          const semData = record[semester];
          if (!semData) return;

          const hocKy = semester === "HK1" ? 1 : 2;

          // Find matching phanCongDay
          const phanCong = phanCongData.find((p) => {
            const pTeacherId = p?.giaoVienId ?? p?.giaoVien?.id;
            const pSubjectId = p?.monHocId ?? p?.monHoc?.id;
            const pClassId = p?.lopId ?? p?.lop?.id;
            const pHocKy = p?.hocKy;
            const pNamHoc = p?.namHoc;
            return (
              Number(pTeacherId) === Number(currentTeacher.id) &&
              Number(pSubjectId) === subjectId &&
              Number(pClassId) === Number(classId) &&
              Number(pHocKy) === hocKy &&
              pNamHoc === selectedNamHoc
            );
          });

          if (!phanCong) return;

          const phanCongDayId = phanCong.id;
          const subject = allSubjects.find((s) => Number(s.id) === subjectId);
          const policy = getPolicyBySubjectName(subject?.tenMon || "");

          if (policy.mode === "COMMENT") {
            // Only nhanXet row
            const idKey = `${key}_COMMENT_0_${semester}`;
            const existingId = savedRecordIds[idKey];
            diemRows.push({
              ...(existingId ? { id: existingId } : {}),
              hocSinh: { id: studentId },
              monHoc: { id: subjectId },
              phanCongDay: { id: phanCongDayId },
              loaiDiem: "TX",
              soThuTu: 0,
              hocKy,
              namHoc: selectedNamHoc,
              giaTriDiem: null,
              nhanXet: semData.nhanXet || "DAT",
              giaoVienNhap: { id: currentTeacher.id },
              status: "DRAFT"
            });
          } else {
            // TX scores
            (semData.tx || []).forEach((val, index) => {
              let score = null;
              if (val !== "" && val !== null && val !== undefined) {
                score = Number(val);
                if (Number.isNaN(score)) return;
              }

              const idKey = `${key}_TX_${index + 1}_${semester}`;
              const existingId = savedRecordIds[idKey];
              
              // Skip if it's an empty score that hasn't been saved yet
              if (score === null && !existingId) return;

              diemRows.push({
                ...(existingId ? { id: existingId } : {}),
                hocSinh: { id: studentId },
                monHoc: { id: subjectId },
                phanCongDay: { id: phanCongDayId },
                loaiDiem: "TX",
                soThuTu: index + 1,
                hocKy,
                namHoc: selectedNamHoc,
                giaTriDiem: score,
                nhanXet: null,
                giaoVienNhap: { id: currentTeacher.id },
                status: "DRAFT"
              });
            });

            // GK
            let gkScore = null;
            if (semData.gk !== "" && semData.gk !== null && semData.gk !== undefined) {
              gkScore = Number(semData.gk);
              if (Number.isNaN(gkScore)) gkScore = null;
            }

            const idKeyGk = `${key}_GK_0_${semester}`;
            const existingIdGk = savedRecordIds[idKeyGk];
            
            if (gkScore !== null || existingIdGk) {
                diemRows.push({
                  ...(existingIdGk ? { id: existingIdGk } : {}),
                  hocSinh: { id: studentId },
                  monHoc: { id: subjectId },
                  phanCongDay: { id: phanCongDayId },
                  loaiDiem: "GK",
                  soThuTu: 0,
                  hocKy,
                  namHoc: selectedNamHoc,
                  giaTriDiem: gkScore,
                  nhanXet: null,
                  giaoVienNhap: { id: currentTeacher.id },
                  status: "DRAFT"
                });
            }

            // CK
            let ckScore = null;
            if (semData.ck !== "" && semData.ck !== null && semData.ck !== undefined) {
              ckScore = Number(semData.ck);
              if (Number.isNaN(ckScore)) ckScore = null;
            }

            const idKeyCk = `${key}_CK_0_${semester}`;
            const existingIdCk = savedRecordIds[idKeyCk];

            if (ckScore !== null || existingIdCk) {
                diemRows.push({
                  ...(existingIdCk ? { id: existingIdCk } : {}),
                  hocSinh: { id: studentId },
                  monHoc: { id: subjectId },
                  phanCongDay: { id: phanCongDayId },
                  loaiDiem: "CK",
                  soThuTu: 0,
                  hocKy,
                  namHoc: selectedNamHoc,
                  giaTriDiem: ckScore,
                  nhanXet: null,
                  giaoVienNhap: { id: currentTeacher.id },
                  status: "DRAFT"
                });
            }
          }
        });
      });

      if (diemRows.length === 0) {
        setSaveMessage("Không có điểm nào để lưu.");
        setSaving(false);
        return;
      }

      const res = await saveAllDiem(diemRows);
      const saved = res?.data?.data || [];

      // Update savedRecordIds with returned IDs
      const newIds = { ...savedRecordIds };
      saved.forEach((row) => {
        const studentId = row?.hocSinh?.id ?? row?.hocSinhId;
        const subjectId = row?.monHoc?.id ?? row?.monHocId;
        if (!studentId || !subjectId) return;
        const key = getRecordKey(studentId, subjectId);
        const semester = row.hocKy === 1 ? "HK1" : "HK2";
        const idKey = `${key}_${row.loaiDiem}_${row.soThuTu || 0}_${semester}`;
        if (row.id) {
          newIds[idKey] = row.id;
        }
      });
      setSavedRecordIds(newIds);

      // Save to localStorage as cache
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftRecords));
      } catch {
        // ignore
      }

      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleString("vi-VN"));
      setError("");
      notifySuccess("Đã lưu thành công");
      setSaveMessage("Đã lưu thành công");
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể lưu điểm. Vui lòng thử lại.";
      setError(msg);
      setSaveMessage("");
      // Fallback: save to localStorage
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftRecords));
      } catch {
        // ignore
      }
    } finally {
      setSaving(false);
    }
  };

  const statistics = useMemo(() => {
    if (!selectedSubject) {
      return { students: 0, completed: 0, avg: 0 };
    }

    let completed = 0;
    const avgs = [];

    filteredStudents.forEach((student) => {
      const record = getFullRecord(student.id, selectedSubject);
      const sem = record[selectedSemester];

      if (selectedPolicy.mode === "COMMENT") {
        if (sem.nhanXet) completed += 1;
        return;
      }

      const avg = calcSemesterAverage(sem);
      if (avg !== null) {
        completed += 1;
        avgs.push(avg);
      }
    });

    const mean = avgs.length
      ? Number((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(1))
      : 0;

    return {
      students: filteredStudents.length,
      completed,
      avg: mean
    };
  }, [filteredStudents, selectedSemester, selectedPolicy.mode, selectedSubject, draftRecords]);



  const scoreGridColumns = useMemo(() => {
    if (selectedPolicy.mode === "COMMENT") {
      return "minmax(160px, 1fr) minmax(120px, 1fr) 100px 100px";
    }

    // Make the first column flexible and make score columns narrow but flexible
    return `minmax(160px, 1fr) repeat(${selectedPolicy.txCount}, minmax(64px, 1fr)) 96px 96px 96px 96px 120px`;
  }, [selectedPolicy.mode, selectedPolicy.txCount]);

  const inputClassFilter = "w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans text-slate-900 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-[1600px] mx-auto flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">
                Bảng nhập điểm theo môn
              </h1>
              {selectedSubject && (
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg text-[13px] font-bold">
                  <span className="material-symbols-outlined text-[17px]">book</span>
                  Môn {selectedSubject.tenMon}
                </span>
              )}
              {selectedClassObj && (
                <span className="text-[13px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px]">class</span>
                  Lớp {selectedClassObj.tenLop}
                  <span className="text-slate-300">•</span>
                  {filteredStudents.length} học sinh
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[14px] font-medium text-slate-500 flex items-center gap-2">
              Nhập và quản lý điểm số cho học sinh các lớp được phân công giảng dạy ({selectedSemester === "HK1" ? "Học kỳ 1" : "Học kỳ 2"} - Năm học {selectedNamHoc}).
              {lastSavedAt && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Cập nhật lúc {lastSavedAt}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <TeacherFilter filters={filters} showClass={false} showGrade={false} showSubject={false} />

            <button 
              type="button" 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-[10px] text-[14px] font-medium transition-all shadow-sm shadow-blue-500/20 disabled:opacity-60" 
              onClick={handleSave} 
              disabled={!isDirty || saving || !isSelectedSubjectTaughtByMe}
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {saving ? "Đang lưu..." : "Cập nhật"}
            </button>
          </div>
        </div>

        {/* Tabs chọn môn học ngang (chỉ hiển thị nếu giáo viên dạy nhiều hơn 1 môn) */}
        {allowedSubjects && allowedSubjects.length > 1 && (
          <div className="relative flex items-center bg-white px-2 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            {dragScroll.canScrollLeft && (
              <button
                type="button"
                onClick={() => dragScroll.scrollLeft(250)}
                className="absolute left-1 z-10 w-8 h-8 rounded-full bg-white/95 border border-slate-300 shadow-sm flex items-center justify-center cursor-pointer text-slate-700 hover:bg-slate-50 transition-all"
                aria-label="Cuộn sang trái"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            <div
              ref={dragScroll.ref}
              className="flex gap-2 overflow-x-auto w-full px-2 hide-scroll-tabs"
              {...dragScroll.events}
              style={{
                cursor: dragScroll.isDragging ? "grabbing" : "grab",
                userSelect: dragScroll.isDragging ? "none" : "auto",
                scrollbarWidth: "none"
              }}
            >
              {allowedSubjects.map(s => {
                const isActive = String(selectedSubjectId) === String(s.id);
                return (
                  <button
                    key={s.id}
                    data-subject-id={s.id}
                    onClick={() => setSelectedSubjectId(String(s.id))}
                    className={`flex items-center gap-1.5 whitespace-nowrap py-2 px-3 font-semibold text-[14px] transition-all rounded-lg ${
                      isActive
                        ? "bg-blue-600 text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">book</span>
                    {s.tenMon}
                  </button>
                );
              })}
            </div>

            {dragScroll.canScrollRight && (
              <button
                type="button"
                onClick={() => dragScroll.scrollRight(250)}
                className="absolute right-1 z-10 w-8 h-8 rounded-full bg-white/95 border border-slate-300 shadow-sm flex items-center justify-center cursor-pointer text-slate-700 hover:bg-slate-50 transition-all"
                aria-label="Cuộn sang phải"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        )}

        {/* Tabs chọn lớp ngang của giáo viên */}
        {filteredClasses && filteredClasses.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 hide-scrollbar bg-white px-3 py-2 rounded-xl shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 pr-2 shrink-0">Lớp dạy:</span>
            {filteredClasses.map(c => {
              const isSelected = String(filters.selectedClassId) === String(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => filters.setSelectedClassId(String(c.id))}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg font-bold text-[14px] transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Lớp {c.tenLop}
                </button>
              );
            })}
          </div>
        )}

        {/* Thống kê nhẹ nhàng (Không Card) */}
        {selectedClass && (
          <div className="flex flex-wrap items-center gap-6 text-[14px] text-slate-600 font-medium pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500 text-[18px]">group</span>
              Học sinh: <strong className="text-slate-900">{(loading || filterLoading) ? "..." : statistics.students}</strong>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">task_alt</span>
              Đã nhập: <strong className="text-slate-900">{(loading || filterLoading) ? "..." : statistics.completed}</strong>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">school</span>
              {selectedSemester === "HK1" ? "Học kỳ 1" : "Học kỳ 2"}
            </div>
          </div>
        )}

        {/* Message */}
        {(error || filterError) && <div className="text-[14px] font-bold text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{error || filterError}</div>}
        {!(error || filterError) && saveMessage && <div className="text-[14px] font-bold text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200 flex items-center gap-2"><span className="material-symbols-outlined">check_circle</span>{saveMessage}</div>}
        
        {/* Empty States */}
        {!(error || filterError) && !(loading || filterLoading) && filteredClasses.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs my-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">assignment_late</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Không có phân công giảng dạy</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Giáo viên chưa được phân công giảng dạy cho lớp nào trong năm học <strong className="text-slate-700">{selectedNamHoc}</strong> ({selectedSemester === "HK1" ? "Học kỳ 1" : "Học kỳ 2"}). Vui lòng chọn năm học hoặc học kỳ khác.
            </p>
          </div>
        )}

        {!(error || filterError) && !(loading || filterLoading) && filteredClasses.length > 0 && !selectedClass && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs my-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">touch_app</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Vui lòng chọn lớp học</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Bấm vào danh sách các lớp ở trên để xem danh sách học sinh và tiến hành nhập điểm.
            </p>
          </div>
        )}

        {!(error || filterError) && !(loading || filterLoading) && selectedClass && !selectedSubject && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs my-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">menu_book</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Vui lòng chọn môn học</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Bấm chọn một môn học ở thanh trên để bắt đầu nhập điểm cho lớp {selectedClassObj?.tenLop || ""}.
            </p>
          </div>
        )}

        {!(error || filterError) && !(loading || filterLoading) && selectedClass && selectedSubject && filteredStudents.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs my-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">person_off</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Lớp chưa có học sinh</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Lớp {selectedClassObj?.tenLop || ""} hiện chưa có danh sách học sinh đang theo học.
            </p>
          </div>
        )}

        {/* Bảng nhập điểm Data Table */}
        {!!selectedSubject && filteredStudents.length > 0 && (
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-max">
                {/* Sticky Header */}
                <thead className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5 text-[13px] font-bold text-slate-700 uppercase tracking-wider sticky left-0 bg-slate-50 border-r border-slate-200 z-20" style={{ minWidth: "180px" }}>
                      Học sinh
                    </th>
                    {selectedPolicy.mode === "COMMENT" ? (
                      <>
                        <th className="px-4 py-3.5 text-[13px] font-bold text-slate-700 uppercase tracking-wider text-center">Đánh giá ({selectedSemester})</th>
                        <th className="px-4 py-3.5 text-[13px] font-bold text-slate-700 uppercase tracking-wider text-center">Kết quả cả năm</th>
                        <th className="px-4 py-3.5 text-[13px] font-bold text-slate-700 uppercase tracking-wider text-center">Xếp loại</th>
                      </>
                    ) : (
                      <>
                        {Array.from({ length: selectedPolicy.txCount }).map((_, index) => (
                          <th key={`tx-head-${index}`} className="px-3 py-3.5 text-[13px] font-bold text-slate-700 uppercase tracking-wider text-center" style={{ width: "80px" }}>
                            TX {index + 1}
                          </th>
                        ))}
                        <th className="px-3 py-3.5 text-[13px] font-bold text-slate-700 uppercase tracking-wider text-center border-l border-slate-200" style={{ width: "90px" }}>Giữa kỳ</th>
                        <th className="px-3 py-3.5 text-[13px] font-bold text-slate-700 uppercase tracking-wider text-center" style={{ width: "90px" }}>Cuối kỳ</th>
                        <th className="px-3 py-3.5 text-[13px] font-bold text-slate-700 uppercase tracking-wider text-center border-l border-slate-200" style={{ width: "80px" }}>TBHK</th>
                        <th className="px-3 py-3.5 text-[13px] font-bold text-slate-700 uppercase tracking-wider text-center" style={{ width: "80px" }}>TBNH</th>
                        <th className="px-3 py-3.5 text-[13px] font-bold text-slate-700 uppercase tracking-wider text-center border-l border-slate-200" style={{ width: "120px" }}>Xếp loại</th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {(loading || filterLoading) ? (
                    <tr>
                      <td colSpan={15} className="px-4 py-8 text-center text-slate-500 font-medium">Đang tải điểm...</td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, idx) => {
                      const key = getRecordKey(student.id, selectedSubject.id);
                      const rawRecord = draftRecords[key];
                      const isEven = idx % 2 === 0;
                      const rowBg = isEven ? "bg-white" : "bg-slate-50/40";

                      return (
                        <StudentScoreRow
                          key={student.id}
                          student={student}
                          selectedSubject={selectedSubject}
                          selectedSemester={selectedSemester}
                          selectedPolicy={selectedPolicy}
                          rawRecord={rawRecord}
                          rowBg={rowBg}
                          isColumnLocked={isColumnLocked}
                          updateRecord={updateRecord}
                        />
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && (
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredStudents.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
                  pageSizeOptions={[10, 20, 30, 50, 100]}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

