const fs = require('fs');
const path = 'website/src/features/student/HomePage.jsx';
let content = fs.readFileSync(path, 'utf8');

// I will just use regex to replace everything between `const unreadNotices` and `const classifyLabel` to fix the mess.

const regex = /const unreadNotices[\s\S]*?const classifyLabel/;
const replacement = `const unreadNotices = useMemo(
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

  const todayDay = new Date().getDay() === 0 ? 8 : new Date().getDay() + 1;
  const currentMonth = new Date().getMonth() + 1;
  const isSummerBreak = currentMonth === 6 || currentMonth === 7 || currentMonth === 8;
  
  const todayTimetable = useMemo(() => {
    if (isSummerBreak) return [];
    return [...data.timetable]
      .filter((i) => i.thu === todayDay)
      .sort((a, b) => (a.tietBatDau || 0) - (b.tietBatDau || 0));
  }, [data.timetable, todayDay, isSummerBreak]);

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
  const classifyLabel`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');
