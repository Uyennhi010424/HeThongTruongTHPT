import { useEffect, useMemo, useState } from "react";
import { getMonHoc } from "../../api/monhocApi.js";
import { getCurrentHocSinh } from "../../api/hocsinhApi.js";
import { getDiem } from "../../api/diemApi.js";
import {
  getPolicyBySubject,
  toScore,
  createEmptySemester,
  calcSemesterAverage,
  calcYearAverage,
  classifyHocLuc
} from "../../utils/scorePolicy.js";
import AiSuggestionCard from "./ai/AiSuggestionCard.jsx";

export default function ScorePage() {
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [scoreRecords, setScoreRecords] = useState({});
  const [selectedSemester, setSelectedSemester] = useState("HK1");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tính năm học hiện tại động theo tháng
  const currentNamHoc = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }, []);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Bước 1: Lấy học sinh + môn học song song
        const [studentRes, subjectsRes] = await Promise.all([
          getCurrentHocSinh(),
          getMonHoc()
        ]);
        if (!active) return;

        const currentStudent = studentRes?.data?.data || null;
        const subjectList = subjectsRes?.data?.data || [];

        setStudent(currentStudent);
        setSubjects(subjectList);

        if (subjectList.length > 0) {
          setSelectedSubjectId(String(subjectList[0].id));
        }

        if (!currentStudent?.id) return;

        // Bước 2: Lấy điểm theo học sinh (chỉ trả về điểm của học sinh này)
        const diemsRes = await getDiem({ hocSinhId: currentStudent.id });
        if (!active) return;

        try {
          const diems = diemsRes?.data?.data || [];
          const records = {};

          const subjectById = subjectList.reduce((acc, s) => {
            acc[String(s.id)] = s;
            return acc;
          }, {});

          diems.forEach((d) => {
            const subjectId = d?.monHoc?.id;
            if (!subjectId) return;
            const key = `${currentStudent.id}_${subjectId}`;

            const subject = subjectById[String(subjectId)];
            const policy = getPolicyBySubject(subject);

            if (!records[key]) {
              records[key] = {
                HK1: { ...createEmptySemester(policy.txCount) },
                HK2: { ...createEmptySemester(policy.txCount) }
              };
            }

            const semesterKey = d?.hocKy === 2 ? "HK2" : "HK1";
            const value = d?.giaTriDiem == null ? "" : String(d.giaTriDiem);

            if (String(d?.loaiDiem || "").toUpperCase() === "TX") {
              const idx = Number(d?.soThuTu || 1) - 1;
              if (idx >= 0) {
                records[key][semesterKey].tx[idx] = value;
              }
            } else if (String(d?.loaiDiem || "").toUpperCase() === "GK") {
              records[key][semesterKey].gk = value;
            } else if (String(d?.loaiDiem || "").toUpperCase() === "CK") {
              records[key][semesterKey].ck = value;
            }

            if (d?.nhanXet) {
              records[key][semesterKey].nhanXet = d.nhanXet;
            }
          });

          setScoreRecords(records);
        } catch (e) {
          console.error("Lỗi parse điểm:", e);
        }
      } catch (err) {
        if (!active) return;
        const status = err?.response?.status;
        if (status === 403) {
          setError("Bạn không có quyền xem điểm. Vui lòng liên hệ quản trị viên.");
        } else if (status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        } else {
          setError("Không thể tải bảng điểm. Vui lòng thử lại sau.");
        }
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
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(String(subjects[0].id));
    }
  }, [selectedSubjectId, subjects]);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => String(subject.id) === selectedSubjectId) || null,
    [subjects, selectedSubjectId]
  );

  const selectedPolicy = useMemo(
    () => getPolicyBySubject(selectedSubject),
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
    const policy = getPolicyBySubject(selectedSubject);
    const current = scoreRecords[key] || {};
    return {
      HK1: { ...createEmptySemester(policy.txCount), ...(current.HK1 || {}) },
      HK2: { ...createEmptySemester(policy.txCount), ...(current.HK2 || {}) }
    };
  }, [scoreRecords, selectedSubject, student?.id]);

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
      const policy = getPolicyBySubject(subject);
      const key = `${student.id}_${subject.id}`;
      const current = scoreRecords[key] || {};
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
  }, [scoreRecords, selectedSemester, student?.id, subjects]);

  // Tính xếp loại học lực theo TT22 (dựa trên ĐTB cả năm tất cả môn)
  const hocLucInfo = useMemo(() => {
    if (!student?.id || subjects.length === 0) return null;

    const yearAverages = [];
    const commentResults = [];

    subjects.forEach((subject) => {
      const policy = getPolicyBySubject(subject);
      
      const key = `${student.id}_${subject.id}`;
      const current = scoreRecords[key] || {};
      
      if (policy.mode === "COMMENT") {
        const hk1 = current.HK1?.nhanXet || "DAT";
        const hk2 = current.HK2?.nhanXet || "DAT";
        const yearResult = (hk1 === "DAT" && hk2 === "DAT") ? "DAT" : "CHUA_DAT";
        commentResults.push(yearResult);
        return;
      }

      const hk1 = { ...createEmptySemester(policy.txCount), ...(current.HK1 || {}) };
      const hk2 = { ...createEmptySemester(policy.txCount), ...(current.HK2 || {}) };

      const hk1Avg = calcSemesterAverage(hk1);
      const hk2Avg = calcSemesterAverage(hk2);
      const yearAvg = calcYearAverage(hk1Avg, hk2Avg);

      if (yearAvg !== null) yearAverages.push(yearAvg);
    });

    if (yearAverages.length === 0) return null;

    const diemTBCaNam = Number(
      (yearAverages.reduce((s, v) => s + v, 0) / yearAverages.length).toFixed(2)
    );
    const classification = classifyHocLuc(diemTBCaNam, yearAverages, commentResults);

    return { diemTBCaNam, ...classification };
  }, [scoreRecords, student?.id, subjects]);

  const hasStudent = Boolean(student?.id);
  const hasScoreRecord = Boolean(
    hasStudent &&
      selectedSubject?.id &&
      scoreRecords[`${student.id}_${selectedSubject.id}`] &&
      typeof scoreRecords[`${student.id}_${selectedSubject.id}`] === "object"
  );

  const scoreList = useMemo(() => {
    return (semesterView.tx || []).map((value, index) => ({
      label: `TX ${index + 1}`,
      value: value === "" ? "--" : value
    }));
  }, [semesterView.tx]);

  return (
    <div className="student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Bảng điểm</h2>
          <p className="student-hero-subtitle">Theo dõi điểm chi tiết theo từng môn học và từng học kỳ.</p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">{loading ? "..." : stats.subjects} môn</div>
          <div className="student-hero-chip">{loading ? "..." : stats.completed} đã nhập</div>
          <div className="student-hero-chip">{loading ? "..." : stats.average} TB</div>
        </div>
      </section>

      <div className="users-stats student-stats">
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

      {hocLucInfo && (
        <div className="card" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="panel-title" style={{ marginBottom: 4 }}>Xếp loại học lực (Thông tư 22)</div>
              <div className="panel-subtitle">
                ĐTB cả năm: <strong>{hocLucInfo.diemTBCaNam}</strong> — Xếp loại:
                <span
                  className="inline-block ml-2 px-2 py-0.5 rounded text-sm font-semibold"
                  style={{ display: "inline-block" }}
                >
                  <span className={hocLucInfo.color} style={{ padding: "2px 8px", borderRadius: 4 }}>
                    {hocLucInfo.label}
                  </span>
                </span>
              </div>
              {hocLucInfo.note && (
                <div className="text-xs text-orange-600 mt-1">{hocLucInfo.note}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {hasStudent && (
      <AiSuggestionCard
          hocSinhId={student.id}
          hocKy={selectedSemester === "HK1" ? 1 : 2}
          namHoc={currentNamHoc}
        />

      )}

      <div className="card users-table student-card">
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
                      <div className="score-metric-label">TB {selectedSemester === "HK1" ? "HK1" : "HK2"}</div>
                      <div className="score-metric-value">{selectedSemester === "HK1" ? (hk1Avg ?? "--") : (hk2Avg ?? "--")}</div>
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
