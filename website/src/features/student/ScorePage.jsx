import { useEffect, useMemo, useState } from "react";
import Header from "../../components/common/Header.jsx";
import { getMonHoc } from "../../api/monhocApi.js";
import { getHocSinh } from "../../api/hocsinhApi.js";
import { getToken } from "../../store/authStore.js";

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
    return { mode: "COMMENT", txCount: 0 };
  }

  if (TX2_SUBJECTS.some((item) => normalized.includes(item))) {
    return { mode: "SCORE", txCount: 2 };
  }

  if (TX4_SUBJECTS.some((item) => normalized.includes(item))) {
    return { mode: "SCORE", txCount: 4 };
  }

  if (TX3_SUBJECTS.some((item) => normalized.includes(item))) {
    return { mode: "SCORE", txCount: 3 };
  }

  return { mode: "SCORE", txCount: 3 };
};

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

export default function ScorePage() {
  const currentUsername = useMemo(() => getCurrentUsername(), []);

  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [draftRecords, setDraftRecords] = useState({});
  const [selectedSemester, setSelectedSemester] = useState("HK1");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [studentsRes, subjectsRes] = await Promise.all([getHocSinh(), getMonHoc()]);
        if (!active) return;

        const students = studentsRes?.data?.data || [];
        const matched = students.find(
          (item) => String(item?.email || "").trim().toLowerCase() === currentUsername
        );
        const currentStudent = matched || students[0] || null;
        const subjectList = subjectsRes?.data?.data || [];

        setStudent(currentStudent);
        setSubjects(subjectList);

        if (subjectList.length > 0) {
          setSelectedSubjectId(String(subjectList[0].id));
        }
      } catch (err) {
        if (!active) return;
        setError("Không thể tải bảng điểm.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [currentUsername]);

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
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(String(subjects[0].id));
    }
  }, [selectedSubjectId, subjects]);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => String(subject.id) === selectedSubjectId) || null,
    [subjects, selectedSubjectId]
  );

  const selectedPolicy = useMemo(
    () => getPolicyBySubjectName(selectedSubject?.tenMon || ""),
    [selectedSubject]
  );

  const fullRecord = useMemo(() => {
    if (!student?.id || !selectedSubject?.id) {
      return {
        HK1: createEmptySemester(3),
        HK2: createEmptySemester(3)
      };
    }

    const key = `${student.id}_${selectedSubject.id}`;
    const policy = getPolicyBySubjectName(selectedSubject.tenMon);
    const current = draftRecords[key] || {};
    return {
      HK1: { ...createEmptySemester(policy.txCount), ...(current.HK1 || {}) },
      HK2: { ...createEmptySemester(policy.txCount), ...(current.HK2 || {}) }
    };
  }, [draftRecords, selectedSubject, student?.id]);

  const semesterView = fullRecord[selectedSemester] || createEmptySemester(selectedPolicy.txCount);

  const hk1Avg = useMemo(() => {
    if (selectedPolicy.mode === "COMMENT") return null;
    return calcSemesterAverage(fullRecord.HK1);
  }, [fullRecord.HK1, selectedPolicy.mode]);

  const hk2Avg = useMemo(() => {
    if (selectedPolicy.mode === "COMMENT") return null;
    return calcSemesterAverage(fullRecord.HK2);
  }, [fullRecord.HK2, selectedPolicy.mode]);

  const yearAvg = useMemo(() => calcYearAverage(hk1Avg, hk2Avg), [hk1Avg, hk2Avg]);

  const stats = useMemo(() => {
    if (!student?.id || subjects.length === 0) {
      return { subjects: subjects.length, completed: 0, average: "--" };
    }

    let completed = 0;
    const averages = [];

    subjects.forEach((subject) => {
      const policy = getPolicyBySubjectName(subject.tenMon);
      const key = `${student.id}_${subject.id}`;
      const current = draftRecords[key] || {};
      const semester = {
        ...createEmptySemester(policy.txCount),
        ...(current[selectedSemester] || {})
      };

      if (policy.mode === "COMMENT") {
        if (semester.nhanXet) completed += 1;
        return;
      }

      const avg = calcSemesterAverage(semester);
      if (avg !== null) {
        completed += 1;
        averages.push(avg);
      }
    });

    const average = averages.length
      ? (averages.reduce((sum, value) => sum + value, 0) / averages.length).toFixed(2)
      : "--";

    return {
      subjects: subjects.length,
      completed,
      average
    };
  }, [draftRecords, selectedSemester, student?.id, subjects]);

  const hasStudent = Boolean(student?.id);
  const hasScoreRecord = Boolean(
    hasStudent &&
      selectedSubject?.id &&
      draftRecords[`${student.id}_${selectedSubject.id}`] &&
      typeof draftRecords[`${student.id}_${selectedSubject.id}`] === "object"
  );

  const scoreList = useMemo(() => {
    return (semesterView.tx || []).map((value, index) => ({
      label: `TX ${index + 1}`,
      value: value === "" ? "--" : value
    }));
  }, [semesterView.tx]);

  return (
    <div className="page users-page">
      <Header title="Bảng điểm" />

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Số môn học</div>
          <div className="stat-value">{loading ? "..." : stats.subjects}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Môn đã có điểm ({selectedSemester})</div>
          <div className="stat-value">{loading ? "..." : stats.completed}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Điểm TB học kỳ</div>
          <div className="stat-value">{loading ? "..." : stats.average}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Bảng điểm theo môn</div>
            <div className="panel-subtitle">Chọn môn học để xem điểm chi tiết</div>
          </div>
          <div className="panel-pill">{student?.hoTen || "--"}</div>
        </div>

        <div className="student-score-toolbar">
          <div className="subject-tabs-wrap">
            <div className="subject-tabs">
              {subjects.map((subject) => (
                <button
                  type="button"
                  key={subject.id}
                  className={`subject-tab ${String(subject.id) === selectedSubjectId ? "active" : ""}`}
                  onClick={() => setSelectedSubjectId(String(subject.id))}
                >
                  {subject.tenMon}
                </button>
              ))}
            </div>
          </div>

          <div className="semester-switch">
            {[
              { value: "HK1", label: "Học kỳ 1" },
              { value: "HK2", label: "Học kỳ 2" }
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                className={`semester-pill ${selectedSemester === item.value ? "active" : ""}`}
                onClick={() => setSelectedSemester(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && !hasStudent && (
          <div className="table-empty">Không tìm thấy thông tin học sinh hiện tại.</div>
        )}

        {!error && !loading && hasStudent && !selectedSubject && (
          <div className="table-empty">Chưa có danh sách môn học.</div>
        )}

        {!error && !loading && hasStudent && selectedSubject && !hasScoreRecord && (
          <div className="table-empty">
            Chưa có điểm cho môn {selectedSubject.tenMon} ở {selectedSemester}. Vui lòng liên hệ giáo viên bộ môn.
          </div>
        )}

        {!error && !loading && hasStudent && selectedSubject && hasScoreRecord && (
          <div className="student-score-content">
            <div className="student-score-card">
              <div className="panel-title">{selectedSubject.tenMon}</div>
              <div className="panel-subtitle">Chi tiết điểm {selectedSemester}</div>

              {selectedPolicy.mode === "COMMENT" ? (
                <div className="score-metrics">
                  <div className="score-metric full">
                    <div className="score-metric-label">Đánh giá</div>
                    <div className="score-metric-value">
                      {semesterView.nhanXet === "CHUA_DAT" ? "Chưa đạt" : "Đạt"}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="score-list">
                    {scoreList.map((item) => (
                      <div className="score-tag" key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                    <div className="score-tag">
                      <span>Giữa kỳ</span>
                      <strong>{semesterView.gk === "" ? "--" : semesterView.gk}</strong>
                    </div>
                    <div className="score-tag">
                      <span>Cuối kỳ</span>
                      <strong>{semesterView.ck === "" ? "--" : semesterView.ck}</strong>
                    </div>
                  </div>

                  <div className="score-metrics">
                    <div className="score-metric">
                      <div className="score-metric-label">TB HK1</div>
                      <div className="score-metric-value">{hk1Avg ?? "--"}</div>
                    </div>
                    <div className="score-metric">
                      <div className="score-metric-label">TB HK2</div>
                      <div className="score-metric-value">{hk2Avg ?? "--"}</div>
                    </div>
                    <div className="score-metric">
                      <div className="score-metric-label">TB cả năm</div>
                      <div className="score-metric-value">{yearAvg ?? "--"}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}