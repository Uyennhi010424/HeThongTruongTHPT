import { useEffect, useMemo, useState, useRef } from "react";
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
  getLearningLevelLabel
} from "../../../utils/scorePolicy.js";
import { normalizeSubjectText } from "../../../utils/normalizeText.js";

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

export default function NhapDiem() {
  const currentUsername = useMemo(() => getCurrentUsernameFromToken(), []);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("HK1");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [namHocList, setNamHocList] = useState([]);
  const [selectedNamHoc, setSelectedNamHoc] = useState("");

  const [draftRecords, setDraftRecords] = useState({});
  const [savedRecordIds, setSavedRecordIds] = useState({});
  const [phanCongData, setPhanCongData] = useState([]);
  const [namHoc, setNamHoc] = useState("");
  const [scoreLocks, setScoreLocks] = useState(() => readScoreLocks());
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const PAGE_SIZE = 20;

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
    if (!filterOpen) return;
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filterOpen]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [studentsRes, classesRes, subjectsRes, teachersRes, phanCongRes, currentGvRes, namHocRes] = await Promise.all([
          getHocSinh(),
          getLop(),
          getMonHoc(),
          getGiaoVien(),
          getPhanCongDay(),
          getCurrentGiaoVien(),
          getNamHoc().catch(() => null)
        ]);

        if (!active) return;

        const subjectData = subjectsRes?.data?.data || [];
        const allClasses = classesRes?.data?.data || [];
        const currentTeacherData = currentGvRes?.data?.data || null;
        const phanCong = phanCongRes?.data?.data || [];

        // Determine current nam hoc
        const allNamHoc = namHocRes?.data?.data || [];
        const years = allNamHoc
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean)
          .sort((a, b) => {
            const yearA = Number(String(a).match(/(\d{4})/)?.[1] || 0);
            const yearB = Number(String(b).match(/(\d{4})/)?.[1] || 0);
            return yearB - yearA;
          });
        setNamHocList(years);
        const activeNamHoc = allNamHoc.find((nh) => nh.trangThai === "DANG_MO") || allNamHoc[allNamHoc.length - 1];
        const currentNamHoc = activeNamHoc?.tenNamHoc || "";
        setSelectedNamHoc((prev) => prev || currentNamHoc);

        setApiTeacher(currentTeacherData);

        let visibleClasses = allClasses;
        if (currentTeacherData) {
          const assignedClassIds = new Set(
            phanCong
              .filter((p) => {
                const entryTeacherId = p?.giaoVienId ?? p?.giaoVien?.id;
                return (
                  entryTeacherId !== undefined &&
                  entryTeacherId !== null &&
                  String(entryTeacherId).trim() !== "" &&
                  Number(entryTeacherId) === Number(currentTeacherData.id)
                );
              })
              .map((p) => String(p?.lopId ?? p?.lop?.id ?? p?.lopHocId ?? ""))
              .filter(Boolean)
          );

          if (assignedClassIds.size > 0) {
            visibleClasses = allClasses.filter((c) => assignedClassIds.has(String(c.id)));
          }
        }

        setStudents(studentsRes?.data?.data || []);
        setClasses(visibleClasses);
        setSubjects(subjectData);
        setTeachers(teachersRes?.data?.data || []);
        setPhanCongData(phanCong);
        setNamHoc(currentNamHoc);

        if (subjectData.length > 0) {
          setSelectedSubjectId(String(subjectData[0].id));
        }

        // Load existing scores from DB
        if (currentTeacherData?.id && currentNamHoc) {
          try {
            const [hk1Res, hk2Res] = await Promise.all([
              getDiem({ giaoVienId: currentTeacherData.id, hocKy: 1, namHoc: currentNamHoc }),
              getDiem({ giaoVienId: currentTeacherData.id, hocKy: 2, namHoc: currentNamHoc })
            ]);

            if (!active) return;

            const allDiem = [
              ...(hk1Res?.data?.data || []),
              ...(hk2Res?.data?.data || [])
            ];

            const { records, ids } = convertDiemRowsToDraft(allDiem);
            setSavedRecordIds(ids);

            // Merge with localStorage cache
            try {
              const cached = window.localStorage.getItem(STORAGE_KEY);
              if (cached) {
                const cachedRecords = JSON.parse(cached);
                if (cachedRecords && typeof cachedRecords === "object") {
                  // DB data takes priority, but fill gaps from cache
                  const merged = { ...cachedRecords };
                  Object.keys(records).forEach((key) => {
                    merged[key] = records[key];
                  });
                  setDraftRecords(merged);
                  return;
                }
              }
            } catch {
              // ignore cache errors
            }

            setDraftRecords(records);
          } catch {
            // If DB load fails, fall back to localStorage
            try {
              const raw = window.localStorage.getItem(STORAGE_KEY);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                  setDraftRecords(parsed);
                }
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu nhập điểm.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const syncLocks = () => setScoreLocks(readScoreLocks());
    window.addEventListener("storage", syncLocks);
    window.addEventListener("score_locks_changed", syncLocks);
    return () => {
      window.removeEventListener("storage", syncLocks);
      window.removeEventListener("score_locks_changed", syncLocks);
    };
  }, []);

  useEffect(() => {
    if (!saveMessage) return undefined;
    const timer = window.setTimeout(() => setSaveMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  // When available classes for the selected grade change, default to the first class
  useEffect(() => {
    const byGrade = selectedGrade === "all" ? classes : classes.filter((item) => String(item?.khoi || "") === selectedGrade);
    if (byGrade.length > 0) {
      setSelectedClass(String(byGrade[0].id));
    } else {
      setSelectedClass("");
    }
  }, [selectedGrade, classes]);

  const availableGrades = useMemo(() => {
    const gradeSet = new Set(
      classes
        .map((item) => item?.khoi)
        .filter((item) => item !== null && item !== undefined && String(item).trim() !== "")
    );

    return Array.from(gradeSet).sort((a, b) => Number(a) - Number(b));
  }, [classes]);

  const filteredClasses = useMemo(() => {
    if (selectedGrade === "all") return classes;
    return classes.filter((item) => String(item?.khoi || "") === selectedGrade);
  }, [classes, selectedGrade]);

  const [apiTeacher, setApiTeacher] = useState(null);

  const currentTeacher = useMemo(() => {
    if (apiTeacher) return apiTeacher;
    return findTeacherByUsername(teachers, currentUsername);
  }, [apiTeacher, teachers, currentUsername]);

  // Reload scores when selectedNamHoc changes
  useEffect(() => {
    if (!selectedNamHoc || !currentTeacher?.id) return;
    let active = true;

    const reloadScores = async () => {
      try {
        const [hk1Res, hk2Res] = await Promise.all([
          getDiem({ giaoVienId: currentTeacher.id, hocKy: 1, namHoc: selectedNamHoc }),
          getDiem({ giaoVienId: currentTeacher.id, hocKy: 2, namHoc: selectedNamHoc })
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
      }
    };

    reloadScores();
    return () => { active = false; };
  }, [selectedNamHoc, currentTeacher?.id]);

  const allowedSubjects = useMemo(() => {
    if (!currentTeacher) return subjects;

    const boMon = normalizeSubjectText(currentTeacher?.boMon || "");
    if (!boMon) return subjects;

    const matched = subjects.filter((subject) => {
      const subjectName = normalizeSubjectText(subject?.tenMon || "");
      return subjectName.includes(boMon) || boMon.includes(subjectName);
    });

    return matched.length > 0 ? matched : subjects;
  }, [subjects, currentTeacher]);

  useEffect(() => {
    if (!allowedSubjects.length) {
      setSelectedSubjectId("");
      return;
    }

    const exists = allowedSubjects.some((subject) => String(subject.id) === selectedSubjectId);
    if (!exists) {
      setSelectedSubjectId(String(allowedSubjects[0].id));
    }
  }, [allowedSubjects, selectedSubjectId]);

  const selectedSubject = useMemo(
    () => allowedSubjects.find((subject) => String(subject.id) === selectedSubjectId) || null,
    [allowedSubjects, selectedSubjectId]
  );

  const selectedClassObj = useMemo(
    () => classes.find((c) => String(c.id) === selectedClass) || null,
    [classes, selectedClass]
  );

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
    let result = students;

    if (selectedGrade !== "all") {
      result = result.filter((student) => String(getStudentClass(student)?.khoi || "") === selectedGrade);
    }

    if (selectedClass) {
      result = result.filter((student) => String(getStudentClassId(student) || "") === selectedClass);
    }

    result = sortStudentsByGivenName(result);

    return result;
  }, [selectedClass, selectedGrade, students]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedGrade, selectedSubjectId, selectedSemester, selectedNamHoc]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, currentPage]);

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

  const updateRecord = (studentId, subjectId, semester, patch) => {
    const subject = subjects.find((item) => item.id === subjectId);
    if (!subject) return;

    const policy = getPolicyBySubjectName(subject.tenMon);
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
  };

  const isColumnLocked = (column) => {
    if (!selectedSubject?.id) return false;
    return isScoreColumnLocked(scoreLocks, selectedSubject.id, selectedSemester, column);
  };

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

        ["HK1", "HK2"].forEach((semester) => {
          const semData = record[semester];
          if (!semData) return;

          const hocKy = semester === "HK1" ? 1 : 2;

          // Find matching phanCongDay
          const phanCong = phanCongData.find((p) => {
            const pTeacherId = p?.giaoVienId ?? p?.giaoVien?.id;
            const pSubjectId = p?.monHocId ?? p?.monHoc?.id;
            const pClassId = p?.lopId ?? p?.lop?.id;
            const pHocKy = p?.hocKy;
            return (
              Number(pTeacherId) === Number(currentTeacher.id) &&
              Number(pSubjectId) === subjectId &&
              Number(pClassId) === Number(classId) &&
              Number(pHocKy) === hocKy
            );
          });

          if (!phanCong) return;

          const phanCongDayId = phanCong.id;
          const subject = subjects.find((s) => Number(s.id) === subjectId);
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
              if (val === "" || val === null || val === undefined) return;
              const score = Number(val);
              if (Number.isNaN(score)) return;

              const idKey = `${key}_TX_${index + 1}_${semester}`;
              const existingId = savedRecordIds[idKey];
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
            if (semData.gk !== "" && semData.gk !== null && semData.gk !== undefined) {
              const gkScore = Number(semData.gk);
              if (!Number.isNaN(gkScore)) {
                const idKey = `${key}_GK_0_${semester}`;
                const existingId = savedRecordIds[idKey];
                diemRows.push({
                  ...(existingId ? { id: existingId } : {}),
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
            }

            // CK
            if (semData.ck !== "" && semData.ck !== null && semData.ck !== undefined) {
              const ckScore = Number(semData.ck);
              if (!Number.isNaN(ckScore)) {
                const idKey = `${key}_CK_0_${semester}`;
                const existingId = savedRecordIds[idKey];
                diemRows.push({
                  ...(existingId ? { id: existingId } : {}),
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
      notifySuccess(`Đã lưu ${saved.length} điểm thành công.`);
      setSaveMessage(`Đã lưu ${saved.length} điểm thành công.`);
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
      ? Number((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2))
      : 0;

    return {
      students: filteredStudents.length,
      completed,
      avg: mean
    };
  }, [filteredStudents, selectedSemester, selectedPolicy.mode, selectedSubject, draftRecords]);

  const learningLevels = useMemo(() => {
    const result = {};

    filteredStudents.forEach((student) => {
      const commentResults = [];
      const numericAverages = [];

      allowedSubjects.forEach((subject) => {
        const policy = getPolicyBySubjectName(subject.tenMon);
        const record = getFullRecord(student.id, subject);

        if (policy.mode === "COMMENT") {
          const finalComment =
            record.HK1.nhanXet === "DAT" && record.HK2.nhanXet === "DAT" ? "DAT" : "CHUA_DAT";
          commentResults.push(finalComment);
          return;
        }

        const hk1Avg = calcSemesterAverage(record.HK1);
        const hk2Avg = calcSemesterAverage(record.HK2);
        numericAverages.push(calcYearAverage(hk1Avg, hk2Avg));
      });

      result[student.id] = getOverallLearningLevel({ commentResults, numericAverages });
    });

    return result;
  }, [filteredStudents, allowedSubjects, draftRecords]);

  const scoreGridColumns = useMemo(() => {
    if (selectedPolicy.mode === "COMMENT") {
      return "minmax(160px, 1fr) minmax(120px, 1fr) 100px 100px";
    }

    // Make the first column flexible and make score columns narrow but flexible
    return `minmax(160px, 1fr) repeat(${selectedPolicy.txCount}, minmax(64px, 1fr)) 96px 96px 96px 96px 120px`;
  }, [selectedPolicy.mode, selectedPolicy.txCount]);

  return (
    <div className="page users-page teacher-page">
      <div className="card users-toolbar">
        <div>
          <div className="users-title">Bảng nhập điểm theo môn</div>
          <div className="users-subtitle">
            Bấm môn học để hiển thị loại điểm và quy định tương ứng
            {lastSavedAt ? ` · Cập nhật lúc ${lastSavedAt}` : ""}
          </div>
        </div>
        <div className="users-actions" style={{ flexWrap: "nowrap" }}>
          <div className="filter-dropdown-wrap" ref={filterRef}>
            <button
              type="button"
              className={`btn-outline filter-toggle${selectedNamHoc || selectedSemester !== "HK1" || selectedGrade !== "all" || selectedClass ? " filter-active" : ""}`}
              onClick={() => setFilterOpen((v) => !v)}
              title="Lọc"
            >
              <span className="material-symbols-outlined">filter_list</span>
              {(selectedSemester !== "HK1" || selectedGrade !== "all" || selectedClass) && <span className="filter-dot" />}
            </button>

            {filterOpen && (
              <div className="filter-dropdown" style={{ zIndex: 9999, bottom: "calc(100% + 8px)", top: "auto" }}>
                <div className="filter-dropdown-title">Lọc danh sách</div>
                <label className="filter-dropdown-label">
                  <span>Năm học</span>
                  <select value={selectedNamHoc} onChange={(event) => setSelectedNamHoc(event.target.value)}>
                    {namHocList.length > 0 ? (
                      namHocList.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))
                    ) : (
                      <option value="">Đang tải...</option>
                    )}
                  </select>
                </label>
                <label className="filter-dropdown-label">
                  <span>Học kỳ</span>
                  <select value={selectedSemester} onChange={(event) => setSelectedSemester(event.target.value)}>
                    <option value="HK1">Học kỳ I</option>
                    <option value="HK2">Học kỳ II</option>
                  </select>
                </label>
                <label className="filter-dropdown-label">
                  <span>Khối</span>
                  <select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)}>
                    <option value="all">Tất cả khối</option>
                    {availableGrades.map((grade) => (
                      <option key={String(grade)} value={String(grade)}>
                        Khối {grade}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="filter-dropdown-label">
                  <span>Lớp</span>
                  <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
                    {filteredClasses.length === 0 ? (
                      <option value="">Không có lớp</option>
                    ) : (
                      filteredClasses.map((lop) => (
                        <option key={lop.id} value={String(lop.id)}>
                          {lop.tenLop}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                {(selectedGrade !== "all" || selectedClass || selectedSemester !== "HK1") && (
                  <button
                    type="button"
                    className="filter-clear"
                    onClick={() => {
                      setSelectedGrade("all");
                      setSelectedClass("");
                      setSelectedSemester("HK1");
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}
          </div>

          <button type="button" className="btn-primary" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? "Đang lưu..." : "Cập nhật"}
          </button>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Học sinh trong danh sách</div>
          <div className="stat-value">{loading ? "..." : statistics.students}</div>
        </div>

        <div className="stat-card stat-sky">
          <div className="stat-label">Đã hoàn tất nhập liệu</div>
          <div className="stat-value">{loading ? "..." : statistics.completed}</div>
        </div>

        <div className="stat-card stat-ice">
          <div className="stat-label">Điểm TBHK môn đang chọn</div>
          <div className="stat-value">{loading ? "..." : statistics.avg}</div>
        </div>
      </div>



      <div className="card users-table">
        <div className="table-header">
          <div className="panel-title">Bảng nhập điểm</div>
          <div className="panel-pill">
            {selectedClassObj ? `Lớp ${selectedClassObj.tenLop} · ` : ""}
            {filteredStudents.length} học sinh
          </div>
        </div>

        {error && <div className="table-empty">{error}</div>}
        {!error && saveMessage && <div className="table-success">{saveMessage}</div>}
        {!error && !loading && filteredStudents.length === 0 && (
          <div className="table-empty">Không có học sinh phù hợp.</div>
        )}

        {!!selectedSubject && (
          <div className="score-grid">
            <div className="score-row score-head" style={{ gridTemplateColumns: scoreGridColumns }}>
              <div>Học sinh</div>

              {selectedPolicy.mode === "COMMENT" ? (
                <>
                  <div>Đánh giá ({selectedSemester})</div>
                  <div>Kết quả cả năm</div>
                  <div>Xếp loại</div>
                </>
              ) : (
                <>
                  {Array.from({ length: selectedPolicy.txCount }).map((_, index) => (
                    <div key={`tx-head-${index}`}>TX {index + 1}</div>
                  ))}
                  <div>Giữa kỳ</div>
                  <div>Cuối kỳ</div>
                  <div>TBHK</div>
                  <div>TBNH</div>
                  <div>Xếp loại</div>
                </>
              )}
            </div>

            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div
                    className="score-row"
                    key={`score-skeleton-${index}`}
                    style={{ gridTemplateColumns: scoreGridColumns }}
                  >
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                  </div>
                ))
              : paginatedStudents.map((student) => {
                  const fullRecord = getFullRecord(student.id, selectedSubject);
                  const semData = fullRecord[selectedSemester];
                  const hk1Avg = calcSemesterAverage(fullRecord.HK1);
                  const hk2Avg = calcSemesterAverage(fullRecord.HK2);
                  const yearAvg = calcYearAverage(hk1Avg, hk2Avg);

                  if (selectedPolicy.mode === "COMMENT") {
                    const finalComment =
                      fullRecord.HK1.nhanXet === "DAT" && fullRecord.HK2.nhanXet === "DAT"
                        ? "DAT"
                        : "CHUA_DAT";

                    return (
                      <div
                        className="score-row"
                        key={student.id}
                        style={{ gridTemplateColumns: scoreGridColumns }}
                      >
                        <div className="table-main">
                          <div className="table-title">{student.hoTen}</div>
                          <div className="table-meta">{getStudentClass(student)?.tenLop || "--"}</div>
                        </div>

                        <div>
                          <select
                            className="score-input"
                            value={semData.nhanXet}
                            disabled={isColumnLocked("comment")}
                            onChange={(event) =>
                              updateRecord(student.id, selectedSubject.id, selectedSemester, {
                                nhanXet: event.target.value
                              })
                            }
                          >
                            <option value="DAT">Đạt</option>
                            <option value="CHUA_DAT">Chưa đạt</option>
                          </select>
                        </div>

                        <div>{finalComment === "DAT" ? "Đạt" : "Chưa đạt"}</div>

                        <div>
                          <span className="status-pill status-active">
                            {getLearningLevelLabel(learningLevels[student.id])}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      className="score-row"
                      key={student.id}
                      style={{ gridTemplateColumns: scoreGridColumns }}
                    >
                      <div className="table-main">
                        <div className="table-title">{student.hoTen}</div>
                        <div className="table-meta">{getStudentClass(student)?.tenLop || "--"}</div>
                      </div>

                      {Array.from({ length: selectedPolicy.txCount }).map((_, index) => (
                        <div key={`${student.id}-tx-${index}`}>
                          <input
                            className="score-input"
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={semData.tx[index] ?? ""}
                            disabled={isColumnLocked(`tx-${index}`)}
                            onChange={(event) => {
                              const raw = event.target.value;
                              if (raw === "") {
                                const nextTx = [...(semData.tx || [])];
                                nextTx[index] = "";
                                updateRecord(student.id, selectedSubject.id, selectedSemester, {
                                  tx: nextTx
                                });
                                return;
                              }

                              const n = Number(raw);
                              if (Number.isNaN(n) || n < 0 || n > 10) {
                                notifyError("Điểm phải là số trong khoảng 0 - 10");
                                return;
                              }

                              const nextTx = [...(semData.tx || [])];
                              nextTx[index] = raw;
                              updateRecord(student.id, selectedSubject.id, selectedSemester, {
                                tx: nextTx
                              });
                            }}
                          />
                        </div>
                      ))}

                      <div>
                        <input
                          className="score-input"
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={semData.gk}
                          disabled={isColumnLocked("gk")}
                          onChange={(event) => {
                              const raw = event.target.value;
                              if (raw === "") {
                                updateRecord(student.id, selectedSubject.id, selectedSemester, { gk: "" });
                                return;
                              }
                              const n = Number(raw);
                              if (Number.isNaN(n) || n < 0 || n > 10) {
                                notifyError("Điểm phải là số trong khoảng 0 - 10");
                                return;
                              }

                              updateRecord(student.id, selectedSubject.id, selectedSemester, { gk: raw });
                            } }
                        />
                      </div>

                      <div>
                        <input
                          className="score-input"
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={semData.ck}
                          disabled={isColumnLocked("ck")}
                          onChange={(event) => {
                              const raw = event.target.value;
                              if (raw === "") {
                                updateRecord(student.id, selectedSubject.id, selectedSemester, { ck: "" });
                                return;
                              }
                              const n = Number(raw);
                              if (Number.isNaN(n) || n < 0 || n > 10) {
                                notifyError("Điểm phải là số trong khoảng 0 - 10");
                                return;
                              }

                              updateRecord(student.id, selectedSubject.id, selectedSemester, { ck: raw });
                            } }
                        />
                      </div>

                      <div>{calcSemesterAverage(semData) ?? "--"}</div>
                      <div>{yearAvg ?? "--"}</div>

                      <div>
                        <span className="status-pill status-active">
                          {getLearningLevelLabel(learningLevels[student.id])}
                        </span>
                      </div>
                    </div>
                  );
                })}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredStudents.length > PAGE_SIZE && (
          <div className="pagination">
            <div className="pagination-info">
              Hiển thị {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} / {filteredStudents.length} học sinh
            </div>
            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
              >
                «
              </button>
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .reduce((acc, page, idx, arr) => {
                  if (idx > 0 && page - arr[idx - 1] > 1) {
                    acc.push("...");
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      className={`pagination-btn${page === currentPage ? " pagination-active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                )}
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
