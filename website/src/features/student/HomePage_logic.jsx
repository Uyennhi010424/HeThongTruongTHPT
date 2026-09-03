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
import { getDayLabel, getCurrentSemesterWeek } from "../../utils/helpers.js";
import { getNamHoc } from "../../api/namhocApi.js";

const HANH_KIEM_LABELS = {
  TOT: "Tá»‘t",
  KHA: "KhÃ¡",
  TRUNG_BINH: "Trung bÃ¬nh",
  YEU: "Yáº¿u",
};

/* Báº£ng mÃ u cho cÃ¡c mÃ´n há»c */
const SUBJECT_COLORS = [
  "#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed",
  "#0891b2", "#be185d", "#4f46e5", "#059669", "#ea580c",
  "#6d28d9", "#0d9488", "#b91c1c", "#1d4ed8", "#a16207",
];

/* CÃ¡c mÃ´n khÃ´ng tÃ­nh vÃ o biá»ƒu Ä‘á»“ */
const EXCLUDED_SUBJECTS = [
  "giÃ¡o dá»¥c thá»ƒ cháº¥t", "gdtc",
  "Ã¢m nháº¡c", "am nhac",
  "giÃ¡o dá»¥c Ä‘á»‹a phÆ°Æ¡ng", "giao duc dia phuong",
  "hÆ°á»›ng nghiá»‡p", "huong nghiep",
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
        const [noticesRes, rawSubjectsRes, studentRes] = await Promise.all([
          getThongBao(),
          getMonHoc(),
          getCurrentHocSinh(),
        ]);
        const subjectsRes = {
          data: {
            data: (rawSubjectsRes?.data?.data || []).filter(s => {
              const name = (s.tenMon || "").toLowerCase();
              return !name.includes("shdc") && !name.includes("sinh hoáº¡t lá»›p");
            })
          }
        };
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
        // Lấy thông tin năm học từ database để xác định đúng năm học/học kỳ/tuần hiện tại
        let curNamHoc = "";
        let curHocKy = 1;
        let activeYearObj = null;
        try {
          const namHocRes = await getNamHoc();
          activeYearObj = years.find((y) => (y.trangThai || y.trang_thai) === "DANG_MO") || years[0] || null;
          if (activeYearObj) {
            curNamHoc = activeYearObj.tenNamHoc || "";
            // Xác định học kỳ hiện tại bằng ngày bắt đầu HK2 từ database
            if (activeYearObj.ngayBatDauHk2) {
              const today = new Date().toISOString().slice(0, 10);
              if (today >= activeYearObj.ngayBatDauHk2) curHocKy = 2;
            }
          } else {
            // Fallback: tính theo tháng hệ thống nếu không có năm học nào
            const now = new Date();
            const curMonth = now.getMonth() + 1;
            curNamHoc = curMonth >= 9
              ? `${now.getFullYear()}-${now.getFullYear() + 1}`
              : `${now.getFullYear() - 1}-${now.getFullYear()}`;
            curHocKy = curMonth >= 9 || curMonth <= 1 ? 1 : 2;
          }
        } catch { /* ignore, sẽ fallback */ }

        // Tính tuần hiện tại từ ngayBatDauHk1 đã lưu trong database
        const currentTuan = getCurrentSemesterWeek(activeYearObj);

        const fetchPromises = [];
        if (lopId) {
          fetchPromises.push(
            // Lấy TKB của tuần hiện tại đúng với cài đặt database
            getThoiKhoaBieu({ lopId, namHoc: curNamHoc, hocKy: curHocKy, tuan: currentTuan })
              .then((r) => {
                timetableData = r?.data?.data || [];
              })
              .catch(() => { }),
            getLichThiByLop(lopId)
              .then((r) => {
                examsData = r?.data?.data || [];
              })
              .catch(() => { })
          );
        }
        if (hocSinhId) {
          fetchPromises.push(
            getDiem({ hocSinhId })
              .then((r) => {
                scoresData = r?.data?.data || [];
              })
              .catch(() => { }),
            getHanhKiem({ hocSinhId })
              .then((r) => {
                conductsData = r?.data?.data || [];
              })
              .catch(() => { })
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
              .catch(() => { })
          );
        }
        await Promise.all(fetchPromises);
        if (!active) return;
        // Fallback: nếu không có TKB theo tuần hiện tại, thử lấy theo tuần lớn nhất có dữ liệu
        if (lopId && timetableData.length === 0) {
          try {
            const fb = await getThoiKhoaBieu({ lopId, namHoc: curNamHoc, hocKy: curHocKy });
            const allData = fb?.data?.data || [];
            if (allData.length > 0) {
              // Tìm tuần gần nhất với tuần hiện tại có dữ liệu
              const availableWeeks = [...new Set(allData.map((i) => i.tuan || 0).filter(Boolean))].sort((a, b) => a - b);
              const closestWeek = availableWeeks.reduce((prev, curr) =>
                Math.abs(curr - currentTuan) < Math.abs(prev - currentTuan) ? curr : prev
                , availableWeeks[availableWeeks.length - 1]);
              timetableData = allData.filter((i) => i.tuan === closestWeek);
            }
          } catch { }
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
        setError("KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u trang chá»§.");
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
      m[s.id] = s.tenMon || s.tenMonHoc || `MÃ´n ${s.id}`;
    return m;
  }, [data.subjects]);
  const getSubjectName = (id) => subjectMap[id] || `MÃ´n ${id}`;

  /* â”€â”€ Danh sÃ¡ch nÄƒm há»c tá»« dá»¯ liá»‡u Ä‘iá»ƒm â”€â”€ */
  const namHocList = useMemo(() => {
    if (!data.scores?.length) return [];
    const set = new Set();
    for (const s of data.scores) {
      if (s.namHoc) set.add(s.namHoc);
    }
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [data.scores]);

  /* Tá»± Ä‘á»™ng chá»n nÄƒm há»c má»›i nháº¥t khi dá»¯ liá»‡u thay Ä‘á»•i */
  useEffect(() => {
    if (namHocList.length > 0 && !selectedNamHoc) {
      setSelectedNamHoc(namHocList[0]);
    }
  }, [namHocList, selectedNamHoc]);

  /* â”€â”€ Äiá»ƒm TB theo nÄƒm há»c + há»c ká»³ â”€â”€ */
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

  /* â”€â”€ Äiá»ƒm theo mÃ´n â”€â”€ */
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

  /* â”€â”€ Dá»¯ liá»‡u biá»ƒu Ä‘á»“ â”€â”€ */
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
        name: subjectMap[item.monHocId] || `MÃ´n ${item.monHocId}`,
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
    // Lá»c háº¡nh kiá»ƒm theo nÄƒm há»c vÃ  há»c ká»³ Ä‘ang chá»n
    const hkStr = String(selectedHK);
    const filtered = data.conducts.filter((c) => {
      const matchNamHoc = selectedNamHoc
        ? (c.namHoc === selectedNamHoc || c.tenNamHoc === selectedNamHoc)
        : true;
      const matchHK =
        String(c.hocKy) === hkStr || c.hocKy === selectedHK;
      return matchNamHoc && matchHK;
    });
    // Æ¯u tiÃªn báº£n APPROVED, fallback DRAFT
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
    if (avg >= 8) return "Tá»‘t";
    if (avg >= 6.5) return "KhÃ¡";
    if (avg >= 5) return "Äáº¡t";
    return "ChÆ°a Ä‘áº¡t";
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
        <div style={s.loadingBox}>Äang táº£i dá»¯ liá»‡u...</div>
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
}
