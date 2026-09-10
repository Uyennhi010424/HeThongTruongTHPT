/**
 * Dropdown chọn học sinh cho phụ huynh có nhiều con.
 * Hiển thị tên học sinh + lớp.
 */
export default function StudentSelector({ students, selectedIndex, onSelect }) {
  if (!students || students.length <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 sm:px-4 py-2 max-w-full">
      <span className="text-xs sm:text-sm font-medium text-on-surface-variant whitespace-nowrap">Chọn con:</span>
      <select
        className="rounded-lg border border-outline-variant/50 bg-surface px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-on-surface focus:border-primary focus:outline-none max-w-full"
        value={selectedIndex}
        onChange={(event) => onSelect(Number(event.target.value))}
      >
        {students.map((student, index) => (
          <option key={student.id} value={index}>
            {student.hoTen} — {student.lop?.tenLop || "Chưa xếp lớp"}
          </option>
        ))}
      </select>
    </div>
  );
}
