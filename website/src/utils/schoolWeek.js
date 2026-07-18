const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(String(value).includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getMondayOfWeekContaining = (value) => {
  const date = parseDate(value);
  if (!date) return null;
  const monday = new Date(date);
  const dayOfWeek = monday.getDay();
  monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/** Số tuần trong năm học (tuần 1 = tuần chứa ngày bắt đầu HK1). */
export const getWeekNumber = (year, dateValue) => {
  if (!year?.ngayBatDauHk1 || !dateValue) return 1;
  const week1Monday = getMondayOfWeekContaining(year.ngayBatDauHk1);
  const targetMonday = getMondayOfWeekContaining(dateValue);
  if (!week1Monday || !targetMonday) return 1;
  const diffDays = Math.floor((targetMonday - week1Monday) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
};

/** Danh sách tuần thuộc học kỳ đã chọn. */
export const getSemesterWeekRange = (year, hocKy) => {
  if (!year) return { min: 1, max: 1, weeks: [1] };

  const hk = Number(hocKy) === 2 ? 2 : 1;
  const startDate = hk === 2 ? year.ngayBatDauHk2 : year.ngayBatDauHk1;
  const endDate = hk === 2 ? year.ngayKetThucHk2 : year.ngayKetThucHk1;

  if (!startDate || !endDate) return { min: 1, max: 1, weeks: [1] };

  const min = getWeekNumber(year, startDate);
  const max = getWeekNumber(year, endDate);
  const from = Math.min(min, max);
  const to = Math.max(min, max);
  const weeks = [];
  for (let w = from; w <= to; w += 1) weeks.push(w);
  return { min: from, max: to, weeks };
};

export const isWeekInSemester = (year, hocKy, tuan) => {
  const { weeks } = getSemesterWeekRange(year, hocKy);
  return weeks.includes(Number(tuan));
};

export const getCurrentWeekNumber = (year) => {
  if (!year?.ngayBatDauHk1) return 1;
  const week1Monday = getMondayOfWeekContaining(year.ngayBatDauHk1);
  if (!week1Monday) return 1;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((now - week1Monday) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 1;
  return Math.max(1, Math.floor(diffDays / 7) + 1);
};

/** Tuần mặc định khi chọn học kỳ: tuần hiện tại nếu thuộc HK, không thì tuần đầu HK. */
export const getDefaultTuanInSemester = (year, hocKy) => {
  const { weeks } = getSemesterWeekRange(year, hocKy);
  if (!weeks.length) return 1;
  const current = getCurrentWeekNumber(year);
  return weeks.includes(current) ? current : weeks[0];
};
