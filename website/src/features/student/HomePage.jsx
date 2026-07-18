import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { getThongBao } from "../../api/thongbaoApi.js";
import { getThoiKhoaBieu } from "../../api/thoikhoabieuApi.js";
import { getLichThiByLop } from "../../api/lichthiApi.js";
import { getMonHoc } from "../../api/monhocApi.js";
import { getCurrentHocSinh } from "../../api/hocsinhApi.js";
import { getDiem } from "../../api/diemApi.js";
import { getHanhKiem } from "../../api/hanhkiemApi.js";
import { getStudentStatistics } from "../../api/diemdanhApi.js";
import { getDayLabel } from "../../utils/helpers.js";

const HANH_KIEM_LABELS = {
  TOT: "Tốt",
  KHA: "Khá",
  TRUNG_BINH: "Trung bình",
  YEU: "Yếu",
};

/* Bảng màu cho các môn học */
const SUBJECT_COLORS = [
  "#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed",
  "#0891b2", "#be185d", "#4f46e5", "#059669", "#ea580c",
  "#6d28d9", "#0d9488", "#b91c1c", "#1d4ed8", "#a16207",
];

/* Các môn không tính vào biểu đồ */
const EXCLUDED_SUBJECTS = [
  "giáo dục thể chất", "gdtc",
  "âm nhạc", "am nhac",
  "giáo dục địa phương", "giao duc dia phuong",
  "hướng nghiệp", "huong nghiep",
];

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState(null);
  const [selectedHK, setSelectedHK] = useState(1);
  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [data, setData] = useState({
    notices: [],
    timetable: [],
    exams: [],
    subjects: [],
    scores: [],
    conducts: [],
    attendanceStats: null,
  });

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [noticesRes, subjectsRes, studentRes] = await Promise.all([
          getThongBao(),
          getMonHoc(),
          getCurrentHocSinh(),
        ]);
        if (!active) return;
        const studentData = studentRes?.data?.data || null;
        setStudent(studentData);
        const lopId = studentData?.lop?.id || studentData?.lopId || null;
        const hocSinhId = studentData?.id || null;
        let timetableData = [],
          examsData = [],
          scoresData = [],
          conductsData = [],
          attendanceStats = null;
        const fetchPromises = [];
        if (lopId) {
          const now = new Date();
          const curMonth = now.getMonth() + 1;
          const curNamHoc =
            curMonth >= 9
              ? `${now.getFullYear()}-${now.getFullYear() + 1}`
              : `${now.getFullYear() - 1}-${now.getFullYear()}`;
          const curHocKy = curMonth >= 9 || curMonth <= 1 ? 1 : 2;
          fetchPromises.push(
            getThoiKhoaBieu({ lopId, namHoc: curNamHoc, hocKy: curHocKy })
              .then((r) => {
                timetableData = r?.data?.data || [];
              })
              .catch(() => {}),
            getLichThiByLop(lopId)
              .then((r) => {
                examsData = r?.data?.data || [];
              })
              .catch(() => {})
          );
        }
        if (hocSinhId) {
          fetchPromises.push(
            getDiem({ hocSinhId })
              .then((r) => {
                scoresData = r?.data?.data || [];
              })
              .catch(() => {}),
            getHanhKiem({ hocSinhId })
              .then((r) => {
                conductsData = r?.data?.data || [];
              })
              .catch(() => {})
          );
          const now = new Date();
          const yearStart =
            now.getMonth() >= 8
              ? `${now.getFullYear()}-09-01`
              : `${now.getFullYear() - 1}-09-01`;
          const today = now.toISOString().split("T")[0];
          fetchPromises.push(
            getStudentStatistics(hocSinhId, yearStart, today)
              .then((r) => {
                attendanceStats = r?.data?.data || null;
              })
              .catch(() => {})
          );
        }
        await Promise.all(fetchPromises);
        if (!active) return;
        if (lopId && timetableData.length === 0) {
          try {
            const fb = await getThoiKhoaBieu({ lopId });
            timetableData = fb?.data?.data || [];
          } catch {}
        }
        if (timetableData.length > 0) {
          const maxTuan = Math.max(...timetableData.map((i) => i.tuan || 0));
          if (maxTuan > 0)
            timetableData = timetableData.filter((i) => i.tuan === maxTuan);
        }
        setData({
          notices: noticesRes?.data?.data || [],
          timetable: timetableData,
          exams: examsData,
          subjects: subjectsRes?.data?.data || [],
          scores: scoresData,
          conducts: conductsData,
          attendanceStats,
        });
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu trang chủ.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAll();
    return () => {
      active = false;
    };
  }, []);

  const subjectMap = useMemo(() => {
    const m = {};
    for (const s of data.subjects)
      m[s.id] = s.tenMon || s.tenMonHoc || `Môn ${s.id}`;
    return m;
  }, [data.subjects]);
  const getSubjectName = (id) => subjectMap[id] || `Môn ${id}`;

  /* ── Danh sách năm học từ dữ liệu điểm ── */
  const namHocList = useMemo(() => {
    if (!data.scores?.length) return [];
    const set = new Set();
    for (const s of data.scores) {
      if (s.namHoc) set.add(s.namHoc);
    }
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [data.scores]);

  /* Tự động chọn năm học mới nhất khi dữ liệu thay đổi */
  useEffect(() => {
    if (namHocList.length > 0 && !selectedNamHoc) {
      setSelectedNamHoc(namHocList[0]);
    }
  }, [namHocList, selectedNamHoc]);

  /* ── Điểm TB theo năm học + học kỳ ── */
  const semesterScores = useMemo(() => {
    if (!data.scores?.length) return [];
    return data.scores.filter((s) => {
      const matchNamHoc = selectedNamHoc ? s.namHoc === selectedNamHoc : true;
      const hk = s.hocKy;
      const matchHK = hk === selectedHK || hk === String(selectedHK);
      return matchNamHoc && matchHK;
    });
  }, [data.scores, selectedNamHoc, selectedHK]);

  const dtb = useMemo(() => {
    const pool = semesterScores.length > 0 ? semesterScores : data.scores;
    if (!pool?.length) return null;
    const valid = pool.filter((s) => s.giaTriDiem != null);
    if (!valid.length) return null;
    let ws = 0,
      wt = 0;
    for (const s of valid) {
      const w = s.loaiDiem === "CK" ? 3 : s.loaiDiem === "GK" ? 2 : 1;
      ws += Number(s.giaTriDiem) * w;
      wt += w;
    }
    return wt > 0 ? Math.round((ws / wt) * 100) / 100 : null;
  }, [semesterScores, data.scores]);

  /* ── Điểm theo môn ── */
  const subjectScores = useMemo(() => {
    const pool = semesterScores.length > 0 ? semesterScores : data.scores;
    if (!pool?.length) return [];
    const map = {};
    for (const s of pool) {
      const mid = s.monHocId || s.monHoc?.id;
      if (!mid) continue;
      if (!map[mid]) map[mid] = { monHocId: mid, tx: [], gk: [], ck: [] };
      if (s.loaiDiem === "TX" || s.loaiDiem === "15p" || s.loaiDiem === "15'")
        map[mid].tx.push(Number(s.giaTriDiem));
      else if (s.loaiDiem === "GK" || s.loaiDiem === "1t")
        map[mid].gk.push(Number(s.giaTriDiem));
      else if (s.loaiDiem === "CK" || s.loaiDiem === "thi")
        map[mid].ck.push(Number(s.giaTriDiem));
    }
    return Object.values(map).map((item) => {
      const avgTx = item.tx.length
        ? item.tx.reduce((a, b) => a + b, 0) / item.tx.length
        : null;
      const avgGk = item.gk.length
        ? item.gk.reduce((a, b) => a + b, 0) / item.gk.length
        : null;
      const avgCk = item.ck.length
        ? item.ck.reduce((a, b) => a + b, 0) / item.ck.length
        : null;
      let ws = 0,
        wt = 0;
      if (avgTx != null) {
        ws += avgTx * 1;
        wt += 1;
      }
      if (avgGk != null) {
        ws += avgGk * 2;
        wt += 2;
      }
      if (avgCk != null) {
        ws += avgCk * 3;
        wt += 3;
      }
      const avg = wt > 0 ? Math.round((ws / wt) * 100) / 100 : null;
      return {
        monHocId: item.monHocId,
        tx: avgTx,
        gk: avgGk,
        ck: avgCk,
        avg,
      };
    });
  }, [semesterScores, data.scores]);

  /* ── Dữ liệu biểu đồ ── */
  const subjectColorMap = useMemo(() => {
    const m = {};
    data.subjects.forEach((s, i) => {
      m[s.id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
    });
    return m;
  }, [data.subjects]);

  const chartData = useMemo(() => {
    if (!subjectScores.length) return [];
    return subjectScores
      .filter((item) => {
        if (item.avg == null) return false;
        const name = (subjectMap[item.monHocId] || "").toLowerCase();
        return !EXCLUDED_SUBJECTS.some((ex) => name.includes(ex));
      })
      .map((item) => ({
        name: subjectMap[item.monHocId] || `Môn ${item.monHocId}`,
        avg: item.avg,
        fill: subjectColorMap[item.monHocId] || "#94a3b8",
      }));
  }, [subjectScores, subjectColorMap, subjectMap]);

  const totalAbsent = useMemo(() => {
    if (!data.attendanceStats) return 0;
    return (
      Number(data.attendanceStats.coPhep || 0) +
      Number(data.attendanceStats.khongPhep || 0)
    );
  }, [data.attendanceStats]);

  const hanhKiemRaw = useMemo(() => {
    if (!data.conducts?.length) return null;
    // Lọc hạnh kiểm theo năm học và học kỳ đang chọn
    const hkStr = String(selectedHK);
    const filtered = data.conducts.filter((c) => {
      const matchNamHoc = selectedNamHoc
        ? (c.namHoc === selectedNamHoc || c.tenNamHoc === selectedNamHoc)
        : true;
      const matchHK =
        String(c.hocKy) === hkStr || c.hocKy === selectedHK;
      return matchNamHoc && matchHK;
    });
    // Ưu tiên bản APPROVED, fallback DRAFT
    const approved = filtered.find((c) => c.trangThai === "APPROVED");
    const record = approved || filtered[filtered.length - 1];
    return record?.xepLoai || record?.hanhKiem || null;
  }, [data.conducts, selectedNamHoc, selectedHK]);
  const hanhKiemLabel =
    HANH_KIEM_LABELS[hanhKiemRaw] || hanhKiemRaw || "--";

  const unreadNotices = useMemo(
    () =>
      [...data.notices]
        .filter(
          (i) => i.doiTuong === "HOC_SINH" || i.doiTuong === "ALL"
        )
        .sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang)),
    [data.notices]
  );

  const latestNotice = unreadNotices[0] || null;
  const unreadCount = unreadNotices.length;

  const upcomingExams = useMemo(() => {
    const now = new Date();
    return [...data.exams]
      .filter((i) => i.ngayThi && new Date(i.ngayThi) >= now)
      .sort((a, b) => new Date(a.ngayThi) - new Date(b.ngayThi))
      .slice(0, 4);
  }, [data.exams]);

  const todayDay =
    new Date().getDay() === 0 ? 8 : new Date().getDay() + 1;
  const todayTimetable = useMemo(
    () =>
      [...data.timetable]
        .filter((i) => i.thu === todayDay)
        .sort((a, b) => (a.tietBatDau || 0) - (b.tietBatDau || 0)),
    [data.timetable, todayDay]
  );

  const weekTimetable = useMemo(
    () => [...data.timetable].sort((a, b) => (a.thu || 0) - (b.thu || 0) || (a.tietBatDau || 0) - (b.tietBatDau || 0)),
    [data.timetable]
  );

  const homeroomTeacher = student?.lop?.gvcn || null;

  const classifyColor = (avg) => {
    if (avg == null) return "#9ca3af";
    if (avg >= 8) return "#16a34a";
    if (avg >= 6.5) return "#2563eb";
    if (avg >= 5) return "#ca8a04";
    return "#dc2626";
  };
  const classifyLabel = (avg) => {
    if (avg == null) return "--";
    if (avg >= 8) return "Tốt";
    if (avg >= 6.5) return "Khá";
    if (avg >= 5) return "Đạt";
    return "Chưa đạt";
  };
  const classifyBg = (avg) => {
    if (avg == null) return "#f3f4f6";
    if (avg >= 8) return "#dcfce7";
    if (avg >= 6.5) return "#dbeafe";
    if (avg >= 5) return "#fef9c3";
    return "#fee2e2";
  };

  const hkColor = useMemo(() => {
    const map = {
      TOT: { bg: "#dcfce7", text: "#16a34a" },
      KHA: { bg: "#dbeafe", text: "#2563eb" },
      TRUNG_BINH: { bg: "#fef9c3", text: "#ca8a04" },
      YEU: { bg: "#fee2e2", text: "#dc2626" },
    };
    return map[hanhKiemRaw] || { bg: "#f3f4f6", text: "#6b7280" };
  }, [hanhKiemRaw]);

  const today = new Date();
  const todayLabel = `${getDayLabel(todayDay)}, ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  const s = styles;

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loadingBox}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* ── 2 CỘT: PROFILE + BÊN PHẢI ── */}
      <div style={s.topRow}>
        {/* Cột trái: Profile card */}
        <div style={s.profileCard}>
          <div style={s.profileTop}>
            <div style={s.avatar}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div style={s.profileInfo}>
              <div style={s.profileName}>
                {student?.hoTen || "Học sinh"}
              </div>
              <div style={s.profileMeta}>
                {student?.maHocSinh || "--"} ·{" "}
                <span style={s.statusBadge}>Đang học</span>
              </div>
            </div>
          </div>
          <div style={s.profileGrid}>
            <div style={s.profileField}>
              <div style={s.fieldLabel}>Lớp</div>
              <div style={s.fieldValue}>
                {student?.lop?.tenLop || "--"}
              </div>
            </div>
            <div style={s.profileField}>
              <div style={s.fieldLabel}>Năm sinh</div>
              <div style={s.fieldValue}>
                {student?.ngaySinh
                  ? new Date(student.ngaySinh).getFullYear()
                  : "--"}
              </div>
            </div>
            <div style={s.profileField}>
              <div style={s.fieldLabel}>Giới tính</div>
              <div style={s.fieldValue}>
                {student?.gioiTinh === "Nam" || student?.gioiTinh === "NAM"
                  ? "Nam"
                  : student?.gioiTinh === "Nu" ||
                    student?.gioiTinh === "NỮ" ||
                    student?.gioiTinh === "Nu"
                  ? "Nữ"
                  : "--"}
              </div>
            </div>
            <div style={s.profileField}>
              <div style={s.fieldLabel}>GVCN</div>
              <div style={s.fieldValue}>
                {homeroomTeacher?.hoTen || "--"}
              </div>
            </div>
            <div style={s.profileField}>
              <div style={s.fieldLabel}>Nơi sinh</div>
              <div style={s.fieldValue}>
                {student?.noiSinh || "--"}
              </div>
            </div>
            <div style={s.profileField}>
              <div style={s.fieldLabel}>Năm học / HK</div>
              <div style={s.fieldValue}>
                {selectedNamHoc || student?.lop?.namHoc || "--"} / HK{selectedHK}
              </div>
            </div>
          </div>
          <div
            style={s.detailLink}
            onClick={() => navigate("/student/profile")}
          >
            Xem chi tiết →
          </div>

          {/* Lịch học + Lịch thi hôm nay */}
          <div style={s.divider} />
          <div style={s.sectionHeader}>
            <div style={s.sectionTitle}>Lịch học hôm nay</div>
            <span style={s.todayBadge}>{todayLabel}</span>
          </div>
          {todayTimetable.length === 0 ? (
            <div style={s.emptyText}>Hôm nay không có lịch học.</div>
          ) : (
            <div style={s.scheduleList}>
              {todayTimetable.map((item) => (
                <div style={s.scheduleItem} key={item.id}>
                  <span style={s.schedulePeriod}>
                    Tiết {item.tietBatDau ?? "--"}
                    {item.soTiet > 1 ? `-${(item.tietBatDau || 0) + item.soTiet - 1}` : ""}
                  </span>
                  <span style={s.scheduleSubject}>
                    {item.monHoc?.tenMon || getSubjectName(item.monHocId)}
                  </span>
                  <span style={s.scheduleRoom}>
                    {item.phongHoc || "--"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={s.divider} />
          <div style={s.sectionHeader}>
            <div style={s.sectionTitle}>Lịch thi sắp tới</div>
          </div>
          {upcomingExams.length === 0 ? (
            <div style={s.emptyText}>Chưa có lịch thi sắp tới.</div>
          ) : (
            <div style={s.examList}>
              {upcomingExams.map((item) => (
                <div style={s.examItem} key={item.id}>
                  <div style={s.examDateBox}>
                    <div style={s.examDay}>
                      {item.ngayThi
                        ? new Date(item.ngayThi).getDate()
                        : "--"}
                    </div>
                    <div style={s.examMonth}>
                      {item.ngayThi
                        ? `Th${new Date(item.ngayThi).getMonth() + 1}`
                        : ""}
                    </div>
                  </div>
                  <div style={s.examBody}>
                    <div style={s.examSubject}>
                      {getSubjectName(item.monHocId)}
                    </div>
                    <div style={s.examMeta}>
                      {item.gioBatDau || "--"} · {item.phongThi || "--"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cột phải: Mini cards + Quick-links + Biểu đồ */}
        <div style={s.rightCol}>
          {/* 2 ô nhỏ ngang */}
          <div style={s.miniRow}>
            <div
              style={s.miniCard}
              onClick={() => navigate("/student/timetable")}
            >
              <div style={s.miniLabel}>Lịch học trong tuần</div>
              <div style={s.miniValue}>{weekTimetable.length}</div>
              <div style={s.miniUnit}>tiết</div>
              <div style={s.miniLink}>Xem chi tiết →</div>
            </div>
            <div
              style={{
                ...s.miniCard,
                borderColor: upcomingExams.length > 0 ? "#fbbf24" : "#e5e7eb",
              }}
              onClick={() => navigate("/student/lichthi")}
            >
              <div style={s.miniLabel}>Lịch thi trong tuần</div>
              <div
                style={{
                  ...s.miniValue,
                  color: upcomingExams.length > 0 ? "#d97706" : "#111827",
                }}
              >
                {upcomingExams.length}
              </div>
              <div style={s.miniUnit}>lịch thi</div>
              <div style={s.miniLink}>Xem chi tiết →</div>
            </div>
          </div>

          {/* Quick-links */}
          <div style={s.quickStrip}>
            <div
              style={s.quickItem}
              onClick={() => navigate("/student/score")}
            >
              <svg
                style={s.quickIcon}
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M7 16l4-8 4 4 4-6" />
              </svg>
              <span style={s.quickLabel}>Kết quả học tập</span>
            </div>
            <div
              style={{ ...s.quickItem, borderRight: "none" }}
              onClick={() => navigate("/student/timetable")}
            >
              <svg
                style={s.quickIcon}
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span style={s.quickLabel}>Lịch theo tuần</span>
            </div>
          </div>

          {/* Biểu đồ kết quả học tập */}
          <div style={s.contentCard}>
            <div style={s.sectionHeader}>
              <div style={s.sectionTitle}>Kết quả học tập</div>
              <div style={s.comboRow}>
                <select
                  style={s.selectCombo}
                  value={selectedNamHoc}
                  onChange={(e) => setSelectedNamHoc(e.target.value)}
                >
                  {namHocList.length === 0 && (
                    <option value="">-- Năm học --</option>
                  )}
                  {namHocList.map((nh) => (
                    <option key={nh} value={nh}>
                      {nh}
                    </option>
                  ))}
                </select>
                <select
                  style={s.selectCombo}
                  value={selectedHK}
                  onChange={(e) => setSelectedHK(Number(e.target.value))}
                >
                  <option value={1}>Học kỳ 1</option>
                  <option value={2}>Học kỳ 2</option>
                </select>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div style={s.emptyText}>Chưa có dữ liệu điểm.</div>
            ) : (
              <div style={s.chartWrap}>
                <ResponsiveContainer width="100%" height={440}>
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#374151", fontWeight: 600 }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={110}
                    />
                    <YAxis
                      type="number"
                      domain={[0, 10]}
                      ticks={[0, 2, 4, 6, 8, 10]}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const val = payload[0]?.value;
                        return (
                          <div style={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 13,
                          }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                            <div style={{ color: "#2563eb" }}>Điểm TB: {val?.toFixed(2)}</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="avg" radius={[4, 4, 0, 0]} barSize={28}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey="avg"
                        position="top"
                        formatter={(val) => val.toFixed(1)}
                        style={{ fontSize: 11, fontWeight: 700, fill: "#374151" }}
                      />
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="#374151"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#374151" }}
                      activeDot={{ r: 5 }}
                      tooltipType="none"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Inline Styles ── */
const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 4px",
  },
  loadingBox: {
    textAlign: "center",
    padding: 40,
    color: "#6b7280",
    fontSize: 14,
  },
  errorBox: {
    padding: "12px 16px",
    borderRadius: 8,
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid #fca5a5",
  },

  /* ── Top row ── */
  topRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    alignItems: "stretch",
  },

  /* Profile card */
  profileCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  profileTop: {
    display: "flex",
    gap: 16,
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.3,
  },
  profileMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  statusBadge: {
    display: "inline-block",
    padding: "1px 8px",
    borderRadius: 6,
    background: "#dcfce7",
    color: "#16a34a",
    fontSize: 12,
    fontWeight: 600,
  },
  profileGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  profileField: {
    padding: "8px 10px",
    borderRadius: 8,
    background: "#f9fafb",
    border: "1px solid #f3f4f6",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
    marginTop: 2,
  },
  detailLink: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: 600,
    cursor: "pointer",
    alignSelf: "flex-end",
  },

  /* Right column */
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  noticeBanner: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 12,
    padding: "18px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  bannerLeft: {
    flex: 1,
    minWidth: 0,
  },
  bannerLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
  },
  bannerCount: {
    fontSize: 36,
    fontWeight: 800,
    color: "#2563eb",
    lineHeight: 1.2,
    marginTop: 2,
  },
  bannerPreview: {
    fontSize: 13,
    color: "#374151",
    marginTop: 4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 280,
  },
  bannerLink: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: 600,
    flexShrink: 0,
    marginLeft: 16,
  },
  miniRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  miniCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "14px 16px",
    cursor: "pointer",
  },
  miniLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
  },
  miniValue: {
    fontSize: 28,
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.2,
    marginTop: 4,
  },
  miniUnit: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  miniLink: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: 600,
    marginTop: 8,
  },

  /* ── Quick-link strip ── */
  quickStrip: {
    display: "flex",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  quickItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "14px 8px",
    cursor: "pointer",
    borderRight: "1px solid #e5e7eb",
    transition: "background 0.15s",
  },
  quickIcon: {
    color: "#2563eb",
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    textAlign: "center",
  },

  /* ── Content row ── */
  contentCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
  },
  todayBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: "#2563eb",
    background: "#eff6ff",
    padding: "3px 10px",
    borderRadius: 6,
  },
  comboRow: {
    display: "flex",
    gap: 8,
  },
  selectCombo: {
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    background: "#fff",
    cursor: "pointer",
    outline: "none",
  },

  /* Stat row */
  statRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
  },
  statCell: {
    padding: "10px 12px",
    borderRadius: 8,
    background: "#f9fafb",
    border: "1px solid #f3f4f6",
    textAlign: "center",
  },
  statCellLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  statCellValue: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.3,
    marginTop: 2,
  },
  statCellTag: {
    display: "inline-block",
    padding: "1px 6px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    marginTop: 2,
  },
  statCellSub: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },

  /* Chart */
  chartWrap: {
    width: "100%",
    overflow: "hidden",
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    padding: "16px 0",
    textAlign: "center",
  },

  /* Schedule list */
  scheduleList: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  scheduleItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  schedulePeriod: {
    fontSize: 13,
    fontWeight: 700,
    color: "#2563eb",
    minWidth: 56,
  },
  scheduleSubject: {
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
  },
  scheduleRoom: {
    fontSize: 12,
    color: "#9ca3af",
    flexShrink: 0,
  },

  /* Divider */
  divider: {
    height: 1,
    background: "#e5e7eb",
    margin: "4px 0",
  },

  /* Exam list */
  examList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  examItem: {
    display: "flex",
    gap: 14,
    alignItems: "center",
  },
  examDateBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 8,
    background: "#fee2e2",
    border: "1px solid #fca5a5",
    minWidth: 44,
  },
  examDay: {
    fontSize: 18,
    fontWeight: 800,
    color: "#dc2626",
    lineHeight: 1,
  },
  examMonth: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: 600,
    marginTop: 2,
  },
  examBody: {
    flex: 1,
    minWidth: 0,
  },
  examSubject: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111827",
  },
  examMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
};
