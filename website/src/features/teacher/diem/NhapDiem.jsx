import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getToken } from "../../../store/authStore.js";

const STORAGE_KEY = "teacher_subject_scores_v2";

const COMMENT_ONLY_SUBJECTS = [
  "giao duc the chat",
  "am nhac",
  "noi dung giao duc dia phuong",
  "hoat dong trai nghiem",
  "huong nghiep"
];

const TX2_SUBJECTS = ["gdqp-an", "gdqp an", "giao duc quoc phong", "an ninh"];
const TX4_SUBJECTS = ["toan", "ngu van", "tieng anh"];
const TX3_SUBJECTS = [
  "vat li",
  "hoa hoc",
  "sinh hoc",
  "lich su",
  "dia li",
  "gdkt&pl",
  "gdkt",
  "tin hoc",
  "cong nghe"
];

const normalizeText = (value) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9&\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const createEmptySemester = (txCount) => ({
  tx: Array.from({ length: txCount }, () => ""),
  gk: "",
  ck: "",
  nhanXet: "DAT"
});

const getPolicyBySubjectName = (subjectName) => {
  const normalized = normalizeText(subjectName);

  if (COMMENT_ONLY_SUBJECTS.some((item) => normalized.includes(item))) {
    return { mode: "COMMENT", txCount: 0, label: "Đánh giá bằng nhận xét" };
  }

  if (TX2_SUBJECTS.some((item) => normalized.includes(item))) {
    return { mode: "SCORE", txCount: 2, label: "2 điểm đánh giá thường xuyên" };
  }

  if (TX4_SUBJECTS.some((item) => normalized.includes(item))) {
    return { mode: "SCORE", txCount: 4, label: "4 điểm đánh giá thường xuyên" };
  }

  if (TX3_SUBJECTS.some((item) => normalized.includes(item))) {
    return { mode: "SCORE", txCount: 3, label: "3 điểm đánh giá thường xuyên" };
  }

  return { mode: "SCORE", txCount: 3, label: "3 điểm đánh giá thường xuyên" };
};

const getRecordKey = (studentId, subjectId) => `${studentId}_${subjectId}`;

const toScore = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const score = Number(value);
  if (Number.isNaN(score)) return null;
  return Math.max(0, Math.min(10, score));
};

const calcSemesterAverage = (semesterData) => {
  const txScores = (semesterData.tx || []).map(toScore).filter((item) => item !== null);
  const gk = toScore(semesterData.gk);
  const ck = toScore(semesterData.ck);

  if (txScores.length === 0 || gk === null || ck === null) return null;

  const sumTx = txScores.reduce((acc, curr) => acc + curr, 0);
  const avg = (sumTx + 2 * gk + 3 * ck) / (txScores.length + 5);
  return Number(avg.toFixed(2));
};

const calcYearAverage = (hk1Avg, hk2Avg) => {
  if (hk1Avg === null || hk2Avg === null) return null;
  return Number(((hk1Avg + 2 * hk2Avg) / 3).toFixed(2));
};

const getOverallLearningLevel = ({ commentResults, numericAverages }) => {
  const totalCommentSubjects = commentResults.length;
  const commentNotReached = commentResults.filter((item) => item !== "DAT").length;
  const numericValid = numericAverages.filter((item) => item !== null);

  if (numericValid.length !== numericAverages.length) return "CHUA_DAT";

  const allCommentReached = commentNotReached === 0;
  const allAbove65 = numericValid.every((item) => item >= 6.5);
  const allAbove50 = numericValid.every((item) => item >= 5);
  const allAbove35 = numericValid.every((item) => item >= 3.5);
  const countAbove80 = numericValid.filter((item) => item >= 8).length;
  const countAbove65 = numericValid.filter((item) => item >= 6.5).length;
  const countAbove50 = numericValid.filter((item) => item >= 5).length;

  if (allCommentReached && allAbove65 && countAbove80 >= 6) return "TOT";
  if (allCommentReached && allAbove50 && countAbove65 >= 6) return "KHA";

  const maxOneCommentFailed = totalCommentSubjects > 0 ? commentNotReached <= 1 : true;
  if (maxOneCommentFailed && countAbove50 >= 6 && allAbove35) return "DAT";

  return "CHUA_DAT";
};

const getLearningLevelLabel = (value) => {
  switch (value) {
    case "TOT":
      return "Tốt";
    case "KHA":
      return "Khá";
    case "DAT":
      return "Đạt";
    default:
      return "Chưa đạt";
  }
};

const getCurrentUsername = () => {
  const token = getToken();
  if (!token) return "";

  try {
    const payloadPart = token.split(".")[1] || "";
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(normalized));
    return String(payload?.sub || "").trim().toLowerCase();
  } catch {
    return "";
  }
};

export default function NhapDiem() {
  const currentUsername = useMemo(() => getCurrentUsername(), []);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("HK1");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [draftRecords, setDraftRecords] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [studentsRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
          getHocSinh(),
          getLop(),
          getMonHoc(),
          getGiaoVien()
        ]);

        if (!active) return;

        const subjectData = subjectsRes?.data?.data || [];
        setStudents(studentsRes?.data?.data || []);
        setClasses(classesRes?.data?.data || []);
        setSubjects(subjectData);
        setTeachers(teachersRes?.data?.data || []);

        if (subjectData.length > 0) {
          setSelectedSubjectId(String(subjectData[0].id));
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
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setDraftRecords(parsed);
      }
    } catch {
      setDraftRecords({});
    }
  }, []);

  useEffect(() => {
    if (!saveMessage) return undefined;
    const timer = window.setTimeout(() => setSaveMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  useEffect(() => {
    setSelectedClass("all");
  }, [selectedGrade]);

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

  const currentTeacher = useMemo(() => {
    return (
      teachers.find(
        (item) => String(item?.email || "").trim().toLowerCase() === currentUsername
      ) || null
    );
  }, [teachers, currentUsername]);

  const allowedSubjects = useMemo(() => {
    const boMon = normalizeText(currentTeacher?.boMon || "");
    if (!boMon) return [];

    return subjects.filter((subject) => {
      const subjectName = normalizeText(subject?.tenMon || "");
      return subjectName.includes(boMon) || boMon.includes(subjectName);
    });
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

  const selectedPolicy = useMemo(
    () => getPolicyBySubjectName(selectedSubject?.tenMon || ""),
    [selectedSubject]
  );

  const filteredStudents = useMemo(() => {
    let result = students;

    if (selectedGrade !== "all") {
      result = result.filter((student) => String(student?.lopHoc?.khoi || "") === selectedGrade);
    }

    if (selectedClass !== "all") {
      result = result.filter((student) => String(student?.lopHoc?.id || "") === selectedClass);
    }

    return result;
  }, [selectedClass, selectedGrade, students]);

  const getFullRecord = (studentId, subject) => {
    const policy = getPolicyBySubjectName(subject.tenMon);
    const key = getRecordKey(studentId, subject.id);
    const current = draftRecords[key] || {};

    return {
      HK1: { ...createEmptySemester(policy.txCount), ...(current.HK1 || {}) },
      HK2: { ...createEmptySemester(policy.txCount), ...(current.HK2 || {}) }
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

  const handleSave = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftRecords));
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleString("vi-VN"));
      setError("");
      setSaveMessage("Cập nhật thành công.");
    } catch {
      setError("Không thể lưu bảng điểm. Vui lòng thử lại.");
      setSaveMessage("");
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
      return "240px minmax(170px, 1fr) 140px 140px";
    }

    return `240px repeat(${selectedPolicy.txCount}, minmax(90px, 1fr)) 120px 120px 120px 120px 140px`;
  }, [selectedPolicy.mode, selectedPolicy.txCount]);

  return (
    <div className="page users-page">
      <Header title="Nhập điểm theo môn học" />

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Bảng nhập điểm theo môn</div>
          <div className="users-subtitle">
            Bấm môn học để hiển thị loại điểm và quy định tương ứng
            {lastSavedAt ? ` · Cập nhật lúc ${lastSavedAt}` : ""}
          </div>
        </div>
        <div className="users-actions">
          <label className="form-field">
            <span>Học kỳ</span>
            <select value={selectedSemester} onChange={(event) => setSelectedSemester(event.target.value)}>
              <option value="HK1">Học kỳ I</option>
              <option value="HK2">Học kỳ II</option>
            </select>
          </label>

          <label className="form-field">
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

          <label className="form-field">
            <span>Lớp</span>
            <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
              <option value="all">Tất cả lớp</option>
              {filteredClasses.map((lop) => (
                <option key={lop.id} value={String(lop.id)}>
                  {lop.tenLop}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="btn-primary" onClick={handleSave} disabled={!isDirty}>
            Cập nhật
          </button>
        </div>
      </div>

      <div className="card subject-tabs-wrap">
        <div className="subject-tabs">
          {allowedSubjects.map((subject) => {
            const active = String(subject.id) === selectedSubjectId;
            return (
              <button
                key={subject.id}
                type="button"
                className={`subject-tab ${active ? "active" : ""}`}
                onClick={() => setSelectedSubjectId(String(subject.id))}
              >
                {subject.tenMon}
              </button>
            );
          })}
        </div>

        <div className="table-meta">
          {!currentTeacher
            ? "Không xác định được tài khoản giáo viên hiện tại."
            : !allowedSubjects.length
              ? `Chưa tìm thấy môn phù hợp với bộ môn: ${currentTeacher.boMon || "--"}`
              : `Môn phụ trách: ${currentTeacher.boMon || "--"} · Quy định: ${selectedPolicy.label} · Công thức TBHK = (TĐĐGtx + 2 × GK + 3 × CK)/(số TX + 5), TBNH = (HK1 + 2 × HK2)/3`}
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
          <div>
            <div className="panel-title">Bảng nhập điểm</div>
            <div className="panel-subtitle">Xếp loại học tập tự động theo quy định Tốt/Khá/Đạt/Chưa đạt</div>
          </div>
          <div className="panel-pill">{filteredStudents.length} học sinh</div>
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
              : filteredStudents.map((student) => {
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
                          <div className="table-meta">{student?.lopHoc?.tenLop || "--"}</div>
                        </div>

                        <div>
                          <select
                            className="score-input"
                            value={semData.nhanXet}
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
                        <div className="table-meta">{student?.lopHoc?.tenLop || "--"}</div>
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
                            onChange={(event) => {
                              const nextTx = [...(semData.tx || [])];
                              nextTx[index] = event.target.value;
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
                          onChange={(event) =>
                            updateRecord(student.id, selectedSubject.id, selectedSemester, {
                              gk: event.target.value
                            })
                          }
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
                          onChange={(event) =>
                            updateRecord(student.id, selectedSubject.id, selectedSemester, {
                              ck: event.target.value
                            })
                          }
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
      </div>
    </div>
  );
}
